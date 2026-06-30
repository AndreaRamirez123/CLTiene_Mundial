import { Injectable, Logger } from '@nestjs/common';

export interface ResultadoPartido {
  equipo1: string;
  equipo2: string;
  marcador: string;
  estado: string;
  fuente: string;
}

@Injectable()
export class FootballScraperService {
  private readonly logger = new Logger(FootballScraperService.name);

  // Mapeo español → variantes en inglés/francés usadas por ESPN y Sofascore
  private readonly ALIASES: Record<string, string[]> = {
    'costa de marfil': ['ivory coast', "cote d'ivoire", 'côte d\'ivoire'],
    'paises bajos': ['netherlands', 'holland'],
    'brasil': ['brazil'],
    'alemania': ['germany'],
    'francia': ['france'],
    'espana': ['spain'],
    'belgica': ['belgium'],
    'suecia': ['sweden'],
    'suiza': ['switzerland'],
    'noruega': ['norway'],
    'dinamarca': ['denmark'],
    'estados unidos': ['usa', 'united states', 'us'],
    'eeuu': ['usa', 'united states'],
    'japon': ['japan'],
    'corea del sur': ['south korea'],
    'marruecos': ['morocco'],
    'camerun': ['cameroon'],
    'rumania': ['romania'],
    'turquia': ['turkey', 'turkiye'],
    'grecia': ['greece'],
    'ucrania': ['ukraine'],
    'polonia': ['poland'],
    'hungria': ['hungary'],
    'croacia': ['croatia'],
    'eslovenia': ['slovenia'],
    'eslovaquia': ['slovakia'],
    'serbia': ['serbia'],
    'portugal': ['portugal'],
    'argentina': ['argentina'],
    'colombia': ['colombia'],
    'mexico': ['mexico'],
    'ecuador': ['ecuador'],
    'paraguay': ['paraguay'],
    'uruguay': ['uruguay'],
    'chile': ['chile'],
    'peru': ['peru'],
    'sudafrica': ['south africa'],
    'canada': ['canada'],
    'nueva zelanda': ['new zealand'],
    'arabia saudita': ['saudi arabia'],
    'iran': ['iran'],
    'senegal': ['senegal'],
    'nigeria': ['nigeria'],
    'ghana': ['ghana'],
    'egipto': ['egypt'],
    'argelia': ['algeria'],
    'tunez': ['tunisia'],
    'indonesia': ['indonesia'],
    'rep. democratica del congo': ['dr congo', 'congo dr', 'democratic republic of congo'],
    'rd congo': ['dr congo', 'congo dr', 'democratic republic of congo'],
    'bosnia y herzegovina': ['bosnia', 'bosnia & herzegovina', 'bosnia and herzegovina'],
    'inglaterra': ['england'],
    'escocia': ['scotland'],
    'gales': ['wales'],
    'irlanda': ['ireland', 'republic of ireland'],
    'irlanda del norte': ['northern ireland'],
  };

  private normalizar(texto: string): string {
    return (texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  private obtenerVariantes(nombre: string): string[] {
    const n = this.normalizar(nombre);
    return [n, ...(this.ALIASES[n] || [])];
  }

  private equiposCoinciden(a: string, b: string): boolean {
    const varA = this.obtenerVariantes(a);
    const varB = this.obtenerVariantes(b);
    for (const va of varA) {
      for (const vb of varB) {
        if (!va || !vb) continue;
        if (va === vb || va.includes(vb) || vb.includes(va)) return true;
      }
    }
    return false;
  }

  // ── ESPN API pública (sin auth, sin navegador) ────────────────────────────
  async scrapearESPN(fecha?: string): Promise<ResultadoPartido[]> {
    try {
      const dia = fecha || new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dia}`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      });

      if (!res.ok) {
        this.logger.warn(`ESPN API ${res.status}`);
        return [];
      }

      const data = await res.json();
      const eventos = data?.events || [];

      return eventos.map((ev: any) => {
        const comp = ev.competitions?.[0];
        const eq1 = comp?.competitors?.find((c: any) => c.homeAway === 'home');
        const eq2 = comp?.competitors?.find((c: any) => c.homeAway === 'away');
        const status = comp?.status?.type?.name || '';
        const finalizado = status === 'STATUS_FINAL' || comp?.status?.type?.completed === true;
        const marcador = finalizado
          ? `${eq1?.score ?? 0}-${eq2?.score ?? 0}`
          : 'EN VIVO';

        return {
          equipo1: eq1?.team?.displayName || '',
          equipo2: eq2?.team?.displayName || '',
          marcador,
          estado: finalizado ? 'finalizado' : status,
          fuente: 'ESPN',
        };
      }).filter((p: ResultadoPartido) => p.equipo1 && p.equipo2);
    } catch (err) {
      this.logger.warn(`ESPN error: ${(err as Error).message}`);
      return [];
    }
  }

  // ── Sofascore API pública ─────────────────────────────────────────────────
  async scrapearSofascore(fecha?: string): Promise<ResultadoPartido[]> {
    try {
      const dia = fecha || new Date().toISOString().slice(0, 10);
      const url = `https://api.sofascore.com/api/v1/sport/football/scheduled-events/${dia}`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.sofascore.com/',
        },
      });

      if (!res.ok) {
        this.logger.warn(`Sofascore API ${res.status}`);
        return [];
      }

      const data = await res.json();
      const eventos = (data?.events || []) as any[];

      // Filtrar solo partidos del Mundial FIFA
      const mundial = eventos.filter((ev: any) =>
        ev.tournament?.uniqueTournament?.id === 16 || // FIFA World Cup id
        (ev.tournament?.name || '').toLowerCase().includes('world cup') ||
        (ev.tournament?.name || '').toLowerCase().includes('mundial'),
      );

      return mundial.map((ev: any) => {
        const finalizado = ev.status?.type === 'finished';
        const marcador = finalizado
          ? `${ev.homeScore?.current ?? 0}-${ev.awayScore?.current ?? 0}`
          : 'EN VIVO';

        return {
          equipo1: ev.homeTeam?.name || '',
          equipo2: ev.awayTeam?.name || '',
          marcador,
          estado: ev.status?.type || '',
          fuente: 'Sofascore',
        };
      }).filter((p: ResultadoPartido) => p.equipo1 && p.equipo2);
    } catch (err) {
      this.logger.warn(`Sofascore error: ${(err as Error).message}`);
      return [];
    }
  }

  // ── Método principal: buscar un partido específico ────────────────────────
  async buscarPartido(equipo1: string, equipo2: string, fecha?: string): Promise<{
    encontrado: boolean;
    marcador: string | null;
    finalizado: boolean;
    fuente: string;
    confianza: number;
  }> {
    this.logger.log(`Buscando: ${equipo1} vs ${equipo2}`);

    const [resESPN, resSofa] = await Promise.allSettled([
      this.scrapearESPN(fecha),
      this.scrapearSofascore(fecha),
    ]);

    const fuentes = [
      ...(resESPN.status === 'fulfilled' ? resESPN.value : []),
      ...(resSofa.status === 'fulfilled' ? resSofa.value : []),
    ];

    this.logger.log(`Partidos encontrados en fuentes: ${fuentes.length}`);

    // Buscar el partido en las fuentes
    const coincidencias = fuentes.filter(p =>
      (this.equiposCoinciden(p.equipo1, equipo1) && this.equiposCoinciden(p.equipo2, equipo2)) ||
      (this.equiposCoinciden(p.equipo1, equipo2) && this.equiposCoinciden(p.equipo2, equipo1)),
    );

    if (coincidencias.length === 0) {
      return { encontrado: false, marcador: null, finalizado: false, fuente: '', confianza: 0 };
    }

    // Tomar resultados finalizados primero
    const finalizados = coincidencias.filter(p => p.marcador !== 'EN VIVO' && p.estado === 'finalizado');
    const mejor = finalizados[0] || coincidencias[0];
    const finalizado = mejor.estado === 'finalizado';

    // Confianza: cuántas fuentes coinciden en el mismo marcador
    const marcadores = coincidencias.map(p => p.marcador).filter(m => m !== 'EN VIVO');
    const conteoPorMarcador: Record<string, number> = {};
    for (const m of marcadores) conteoPorMarcador[m] = (conteoPorMarcador[m] || 0) + 1;
    const marcadorFinal = Object.entries(conteoPorMarcador).sort((a, b) => b[1] - a[1])[0]?.[0] || mejor.marcador;
    const confianza = Math.min(coincidencias.length / 2, 1);

    return {
      encontrado: true,
      marcador: finalizado ? marcadorFinal : null,
      finalizado,
      fuente: coincidencias.map(c => c.fuente).join(', '),
      confianza,
    };
  }

  // ── Método legacy para el endpoint /partidos/scraping ─────────────────────
  async scrapingValidado() {
    const hoy = new Date().toISOString().slice(0, 10);
    const [resESPN, resSofa] = await Promise.allSettled([
      this.scrapearESPN(),
      this.scrapearSofascore(hoy),
    ]);

    const todos = [
      ...(resESPN.status === 'fulfilled' ? resESPN.value : []),
      ...(resSofa.status === 'fulfilled' ? resSofa.value : []),
    ];

    return todos;
  }
}
