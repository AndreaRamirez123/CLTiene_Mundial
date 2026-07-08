import { Injectable, Logger } from '@nestjs/common';

export interface ResultadoPartido {
  equipo1: string;
  equipo2: string;
  marcador: string;
  estado: string;
  fuente: string;
  penales?: string | null;
  penalesGanador?: string | null;
}

@Injectable()
export class FootballScraperService {
  private readonly logger = new Logger(FootballScraperService.name);

  // Mapeo español → variantes en inglés/francés usadas por ESPN, Sofascore y API-Football
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
    'cabo verde': ['cape verde'],
    'austria': ['austria'],
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

  // ── API-Football (fuente principal) ──────────────────────────────────────
  async scrapearAPIFootball(fecha?: string): Promise<ResultadoPartido[]> {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      this.logger.warn('API_FOOTBALL_KEY no configurada');
      return [];
    }

    const dia = fecha || new Date().toISOString().slice(0, 10);

    try {
      // Sin filtro de liga — el ID puede variar por edición; el matching de nombres filtra correctamente
      const url = `https://v3.football.api-sports.io/fixtures?date=${dia}`;
      const res = await fetch(url, {
        headers: {
          'x-apisports-key': apiKey,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        this.logger.warn(`API-Football ${res.status}`);
        return [];
      }

      const data = await res.json();
      const fixtures = (data?.response || []) as any[];

      this.logger.log(`API-Football: ${fixtures.length} partido(s) para ${dia}`);

      return fixtures.map((f: any) => {
        const statusShort = f.fixture?.status?.short;
        // FT=tiempo reglamentario, AET=tiempo extra, PEN=penales
        const finalizado = ['FT', 'AET', 'PEN'].includes(statusShort);

        const golesLocal = f.goals?.home ?? 0;
        const golesVisitante = f.goals?.away ?? 0;

        // Penales: api-football retorna el marcador de la tanda
        const penLocal = f.score?.penalty?.home;
        const penVisitante = f.score?.penalty?.away;
        const huboPenales = penLocal !== null && penLocal !== undefined &&
                            penVisitante !== null && penVisitante !== undefined;

        const penales = huboPenales ? `${penLocal}-${penVisitante}` : null;
        const penalesGanador = huboPenales
          ? (penLocal > penVisitante ? 'local' : 'visitante')
          : null;

        return {
          equipo1: f.teams?.home?.name || '',
          equipo2: f.teams?.away?.name || '',
          marcador: finalizado ? `${golesLocal}-${golesVisitante}` : 'EN VIVO',
          estado: finalizado ? 'finalizado' : (statusShort || ''),
          fuente: 'API-Football',
          penales,
          penalesGanador,
        };
      }).filter((p: ResultadoPartido) => p.equipo1 && p.equipo2);
    } catch (err) {
      this.logger.warn(`API-Football error: ${(err as Error).message}`);
      return [];
    }
  }

  // ── ESPN API (fallback) ───────────────────────────────────────────────────
  async scrapearESPN(fecha?: string): Promise<ResultadoPartido[]> {
    const dia = fecha || new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const slugs = ['fifa.world', 'fifa.worldcup', 'fifa.worldcup.2026', 'soccer'];

    for (const slug of slugs) {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${dia}`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        });

        if (!res.ok) { this.logger.warn(`ESPN [${slug}] ${res.status}`); continue; }

        const data = await res.json();
        const eventos = data?.events || [];

        if (eventos.length === 0) {
          this.logger.log(`ESPN [${slug}] sin eventos para ${dia}`);
          continue;
        }

        this.logger.log(`ESPN [${slug}] encontró ${eventos.length} evento(s) para ${dia}`);

        return eventos.map((ev: any) => {
          const comp = ev.competitions?.[0];
          const eq1 = comp?.competitors?.find((c: any) => c.homeAway === 'home');
          const eq2 = comp?.competitors?.find((c: any) => c.homeAway === 'away');
          const status = comp?.status?.type?.name || '';
          const finalizado = status === 'STATUS_FINAL' || comp?.status?.type?.completed === true;
          return {
            equipo1: eq1?.team?.displayName || '',
            equipo2: eq2?.team?.displayName || '',
            marcador: finalizado ? `${eq1?.score ?? 0}-${eq2?.score ?? 0}` : 'EN VIVO',
            estado: finalizado ? 'finalizado' : status,
            fuente: `ESPN:${slug}`,
          };
        }).filter((p: ResultadoPartido) => p.equipo1 && p.equipo2);
      } catch (err) {
        this.logger.warn(`ESPN [${slug}] error: ${(err as Error).message}`);
      }
    }
    return [];
  }

  // ── Sofascore API (fallback) ──────────────────────────────────────────────
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

      if (!res.ok) { this.logger.warn(`Sofascore API ${res.status}`); return []; }

      const data = await res.json();
      const eventos = (data?.events || []) as any[];
      this.logger.log(`Sofascore: ${eventos.length} eventos para ${dia}`);

      return eventos.map((ev: any) => {
        const finalizado = ev.status?.type === 'finished';
        return {
          equipo1: ev.homeTeam?.name || '',
          equipo2: ev.awayTeam?.name || '',
          marcador: finalizado ? `${ev.homeScore?.current ?? 0}-${ev.awayScore?.current ?? 0}` : 'EN VIVO',
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
    penales: string | null;
    ganador: string | null;
  }> {
    this.logger.log(`Buscando: ${equipo1} vs ${equipo2}`);

    // API-Football primero (fuente oficial)
    const resAPIFootball = await this.scrapearAPIFootball(fecha);
    const coincidenciaAPI = resAPIFootball.find(p =>
      (this.equiposCoinciden(p.equipo1, equipo1) && this.equiposCoinciden(p.equipo2, equipo2)) ||
      (this.equiposCoinciden(p.equipo1, equipo2) && this.equiposCoinciden(p.equipo2, equipo1)),
    );

    if (coincidenciaAPI && coincidenciaAPI.marcador !== 'EN VIVO' && coincidenciaAPI.estado === 'finalizado') {
      this.logger.log(`API-Football encontró: ${equipo1} vs ${equipo2} → ${coincidenciaAPI.marcador}${coincidenciaAPI.penales ? ' (pen: ' + coincidenciaAPI.penales + ')' : ''}`);

      // Determinar ganador real (puede ser diferente al marcador si hubo penales)
      let ganador: string | null = null;
      if (coincidenciaAPI.penalesGanador) {
        // Si el partido fue espejo (visitante vs local invertido en la API)
        const esInvertido = this.equiposCoinciden(coincidenciaAPI.equipo1, equipo2);
        ganador = esInvertido
          ? (coincidenciaAPI.penalesGanador === 'local' ? 'visitante' : 'local')
          : coincidenciaAPI.penalesGanador;
      }

      return {
        encontrado: true,
        marcador: coincidenciaAPI.marcador,
        finalizado: true,
        fuente: 'API-Football',
        confianza: 1,
        penales: coincidenciaAPI.penales || null,
        ganador,
      };
    }

    // Fallback: ESPN + Sofascore
    const [resESPN, resSofa] = await Promise.allSettled([
      this.scrapearESPN(fecha),
      this.scrapearSofascore(fecha),
    ]);

    const fuentes = [
      ...(resESPN.status === 'fulfilled' ? resESPN.value : []),
      ...(resSofa.status === 'fulfilled' ? resSofa.value : []),
    ];

    const coincidencias = fuentes.filter(p =>
      (this.equiposCoinciden(p.equipo1, equipo1) && this.equiposCoinciden(p.equipo2, equipo2)) ||
      (this.equiposCoinciden(p.equipo1, equipo2) && this.equiposCoinciden(p.equipo2, equipo1)),
    );

    if (coincidencias.length === 0) {
      return { encontrado: false, marcador: null, finalizado: false, fuente: '', confianza: 0, penales: null, ganador: null };
    }

    const finalizados = coincidencias.filter(p => p.marcador !== 'EN VIVO' && p.estado === 'finalizado');
    const mejor = finalizados[0] || coincidencias[0];
    const finalizado = mejor.estado === 'finalizado';

    const marcadores = coincidencias.map(p => p.marcador).filter(m => m !== 'EN VIVO');
    const conteoPorMarcador: Record<string, number> = {};
    for (const m of marcadores) conteoPorMarcador[m] = (conteoPorMarcador[m] || 0) + 1;
    const marcadorFinal = Object.entries(conteoPorMarcador).sort((a, b) => b[1] - a[1])[0]?.[0] || mejor.marcador;

    return {
      encontrado: true,
      marcador: finalizado ? marcadorFinal : null,
      finalizado,
      fuente: coincidencias.map(c => c.fuente).join(', '),
      confianza: Math.min(coincidencias.length / 2, 1),
      penales: null,
      ganador: null,
    };
  }

  // ── Método legacy para el endpoint /partidos/scraping ─────────────────────
  async scrapingValidado() {
    const hoy = new Date().toISOString().slice(0, 10);
    const [resAPI, resESPN, resSofa] = await Promise.allSettled([
      this.scrapearAPIFootball(hoy),
      this.scrapearESPN(),
      this.scrapearSofascore(hoy),
    ]);
    return [
      ...(resAPI.status === 'fulfilled' ? resAPI.value : []),
      ...(resESPN.status === 'fulfilled' ? resESPN.value : []),
      ...(resSofa.status === 'fulfilled' ? resSofa.value : []),
    ];
  }
}
