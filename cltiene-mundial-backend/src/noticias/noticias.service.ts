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

@Injectable()
export class NoticiasService {
  private readonly logger = new Logger(NoticiasService.name);
  private readonly openaiApiKey: string;
  private readonly openaiModel: string;

  private cache: { data: Noticia[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 1000 * 60 * 5;

  constructor(private configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiModel =
      this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
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

    if (!this.openaiApiKey) {
      this.logger.warn('OPENAI_API_KEY no configurada');
      return [];
    }

    try {
      const noticias = await this.buscarConOpenAI(cantidad);

      if (noticias.length > 0) {
        this.cache = { data: noticias, timestamp: Date.now() };
      }

      return noticias;
    } catch (error) {
      this.logger.error('Error obteniendo noticias', error);
      return this.cache?.data?.slice(0, cantidad) || [];
    }
  }

  private async buscarConOpenAI(cantidad: number): Promise<Noticia[]> {
    const hoy = new Date().toISOString().slice(0, 10);

    const prompt = `Busca ${cantidad} noticias recientes sobre el Mundial FIFA 2026 (USA, México, Canadá). Fecha: ${hoy}.

Incluye noticias variadas: clasificatorias, sedes, selecciones, jugadores, reglas FIFA, calendario, entradas. No repitas temas.

Devuelve exactamente ${cantidad} noticias.`;

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: this.openaiModel,
        tools: [{ type: 'web_search' }],
        tool_choice: 'required',
        text: {
          format: {
            type: 'json_schema',
            name: 'noticias_mundial',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                noticias: {
                  type: 'array',
                  minItems: cantidad,
                  maxItems: cantidad,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      titulo: { type: 'string' },
                      resumen: { type: 'string' },
                      categoria: {
                        type: 'string',
                        enum: [
                          'Selecciones',
                          'Sedes',
                          'Clasificación',
                          'Jugadores',
                          'FIFA',
                        ],
                      },
                      fecha: { type: 'string' },
                      fuente: { type: 'string' },
                      url: { type: 'string' },
                    },
                    required: [
                      'titulo',
                      'resumen',
                      'categoria',
                      'fecha',
                      'fuente',
                      'url',
                    ],
                  },
                },
              },
              required: ['noticias'],
            },
          },
        },
        input: prompt,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI web_search error: ${res.status} ${err}`);
    }

    const data = await res.json();
    const text = this.extraerTexto(data?.output || []);
    const urlsReales = this.extraerUrls(data?.output || []);

    // Parsear JSON de la respuesta
    const clean = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    let noticias: Noticia[];
    try {
      const parsed = JSON.parse(clean) as { noticias?: Noticia[] };
      noticias = Array.isArray(parsed?.noticias) ? parsed.noticias : [];
    } catch {
      const match = clean.match(/\[[\s\S]*\]/);
      noticias = match ? (JSON.parse(match[0]) as Noticia[]) : [];
    }

    // Asignar URLs reales a cada noticia
    noticias = noticias.slice(0, cantidad).map((noticia, i) => {
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

  private extraerTexto(output: any[]): string {
    for (const item of output) {
      if (item?.type === 'message' && Array.isArray(item.content)) {
        const chunk = item.content.find((c: any) => c.type === 'output_text');
        if (chunk?.text) return String(chunk.text);
      }
    }
    return '';
  }

  private extraerUrls(output: any[]): { uri: string; fuente: string }[] {
    for (const item of output) {
      if (item?.type === 'message' && Array.isArray(item.content)) {
        const chunk = item.content.find((c: any) => c.type === 'output_text');
        const annotations = chunk?.annotations || [];
        return annotations
          .filter((a: any) => a.type === 'url_citation' && a.url)
          .map((a: any) => ({
            uri: a.url,
            fuente: a.title || '',
          }));
      }
    }
    return [];
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
