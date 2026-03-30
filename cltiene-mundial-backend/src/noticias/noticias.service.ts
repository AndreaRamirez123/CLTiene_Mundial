import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type Noticia = {
  titulo: string;
  resumen: string;
  categoria: string;
  fecha: string;
  fuente: string;
  url: string;
};

type GroundingChunk = { web?: { uri?: string; title?: string } };

type GeminiResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    groundingMetadata?: {
      groundingChunks?: GroundingChunk[];
    };
  }[];
};

@Injectable()
export class NoticiasService {
  private readonly logger = new Logger(NoticiasService.name);
  private readonly geminiApiKey: string;
  private readonly geminiUrl: string;

  private cache: { data: Noticia[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 1000 * 60 * 15;

  constructor(private configService: ConfigService) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`;
  }

  async obtenerNoticias(limit = 5, forzar = false): Promise<Noticia[]> {
    const cantidad = Math.max(1, Math.min(10, Number(limit) || 5));

    if (
      !forzar &&
      this.cache &&
      Date.now() - this.cache.timestamp < this.CACHE_TTL &&
      this.cache.data.length
    ) {
      return this.cache.data.slice(0, cantidad);
    }

    if (!this.geminiApiKey) {
      this.logger.warn('GEMINI_API_KEY no configurada');
      return [];
    }

    try {
      const noticias = await this.buscarConGemini(cantidad);

      if (noticias.length > 0) {
        this.cache = { data: noticias, timestamp: Date.now() };
      }

      return noticias;
    } catch (error) {
      this.logger.error('Error obteniendo noticias', error);
      return this.cache?.data?.slice(0, cantidad) || [];
    }
  }

  private async buscarConGemini(cantidad: number): Promise<Noticia[]> {
    const hoy = new Date().toISOString().slice(0, 10);

    const prompt = `Busca ${cantidad} noticias recientes sobre el Mundial FIFA 2026 (USA, México, Canadá). Fecha: ${hoy}.

Incluye noticias variadas: clasificatorias, sedes, selecciones, jugadores, reglas FIFA, calendario, entradas. No repitas temas.

Responde SOLO JSON (sin markdown): [{"titulo":"...","resumen":"resumen 2-3 oraciones","categoria":"Selecciones|Sedes|Clasificación|Jugadores|FIFA","fecha":"YYYY-MM-DD","fuente":"nombre medio","url":"url articulo"}]`;

    const res = await axios.post<GeminiResponse>(
      this.geminiUrl,
      {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
      },
      { timeout: 45000 },
    );

    const text =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const grounding = res.data?.candidates?.[0]?.groundingMetadata;
    const chunks = grounding?.groundingChunks || [];

    // Extraer URLs reales del grounding (pueden ser redirects de vertexaisearch)
    const urlsReales = chunks
      .filter((c) => c.web?.uri && c.web?.title)
      .map((c) => ({
        uri: c.web!.uri!,
        fuente: c.web!.title || '',
      }));

    // Parsear JSON de la respuesta
    const clean = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    let noticias: Noticia[];
    try {
      noticias = JSON.parse(clean) as Noticia[];
      if (!Array.isArray(noticias)) noticias = [];
    } catch {
      const match = clean.match(/\[[\s\S]*\]/);
      noticias = match ? (JSON.parse(match[0]) as Noticia[]) : [];
    }

    // Asignar URLs reales del grounding a cada noticia
    noticias = noticias.slice(0, cantidad).map((noticia, i) => {
      // Usar URL del grounding si existe para esta posición
      const groundingUrl = urlsReales[i]?.uri;
      const groundingFuente = urlsReales[i]?.fuente || '';

      return {
        ...noticia,
        url: groundingUrl || noticia.url || '#',
        fuente:
          noticia.fuente ||
          this.limpiarFuente(groundingFuente) ||
          'Medio deportivo',
      };
    });

    return noticias.filter((n) => n.titulo && n.resumen);
  }

  private limpiarFuente(dominio: string): string {
    // El grounding a veces trae solo "tudn.com", "espn.com", etc.
    const mapeo: Record<string, string> = {
      'fifa.com': 'FIFA',
      'espn.com': 'ESPN',
      'marca.com': 'Marca',
      'as.com': 'AS',
      'bbc.com': 'BBC',
      'foxsports.com': 'Fox Sports',
      'uefa.com': 'UEFA',
      'goal.com': 'GOAL',
      'tudn.com': 'TUDN',
      'milenio.com': 'Milenio',
      'eluniversal.com.mx': 'El Universal',
      'sport.es': 'Sport',
    };

    const d = dominio.toLowerCase().replace(/^www\./, '');
    return mapeo[d] || dominio;
  }
}
