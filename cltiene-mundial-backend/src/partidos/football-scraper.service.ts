import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';

export interface ResultadoPartido {
  equipo1: string;
  equipo2: string;
  marcador: string;
  hora: string;
  fuente: string;
}

export interface ResultadoValidado extends ResultadoPartido {
  validado: boolean;
  confianza: number;
  fuentesQueCoinciden: string[];
}

@Injectable()
export class FootballScraperService {
  private readonly logger = new Logger(FootballScraperService.name);

  private async crearBrowser(): Promise<Browser> {
    return puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  private normalizar(texto: string): string {
    return texto?.toLowerCase().trim().replace(/\s+/g, ' ') ?? '';
  }

  private equiposCoinciden(a: string, b: string): boolean {
    if (!a || !b) return false;
    const na = this.normalizar(a);
    const nb = this.normalizar(b);
    return na === nb || na.includes(nb) || nb.includes(na);
  }

  async scrapearFlashScore(): Promise<ResultadoPartido[]> {
    let browser: Browser | undefined;
    try {
      browser = await this.crearBrowser();
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
      await page.goto('https://www.flashscore.com/football/', { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('div.event__match', { timeout: 10000 });

      return await page.evaluate(() =>
        Array.from(document.querySelectorAll('div.event__match'))
          .slice(0, 20)
          .map(el => ({
            equipo1: el.querySelectorAll('span.event__participant')[0]?.textContent?.trim() ?? '',
            equipo2: el.querySelectorAll('span.event__participant')[1]?.textContent?.trim() ?? '',
            marcador: el.querySelector('span.event__score')?.textContent?.trim() || 'EN VIVO',
            hora: el.querySelector('span.event__time')?.textContent?.trim() ?? '',
            fuente: 'FlashScore',
          })),
      );
    } catch (error) {
      this.logger.warn(`FlashScore error: ${(error as Error).message}`);
      return [];
    } finally {
      if (browser) await browser.close();
    }
  }

  async scrapearSofascore(): Promise<ResultadoPartido[]> {
    let browser: Browser | undefined;
    try {
      browser = await this.crearBrowser();
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
      await page.goto('https://www.sofascore.com/football', { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('[data-testid="event_cell"]', { timeout: 10000 });

      return await page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-testid="event_cell"]'))
          .slice(0, 20)
          .map(el => ({
            equipo1: el.querySelector('[data-testid="event_cell_home_team_name"]')?.textContent?.trim() ?? '',
            equipo2: el.querySelector('[data-testid="event_cell_away_team_name"]')?.textContent?.trim() ?? '',
            marcador: el.querySelector('[data-testid="event_cell_score"]')?.textContent?.trim() || 'EN VIVO',
            hora: el.querySelector('[data-testid="event_cell_start_time"]')?.textContent?.trim() ?? '',
            fuente: 'Sofascore',
          })),
      );
    } catch (error) {
      this.logger.warn(`Sofascore error: ${(error as Error).message}`);
      return [];
    } finally {
      if (browser) await browser.close();
    }
  }

  async scrapearESPN(): Promise<ResultadoPartido[]> {
    let browser: Browser | undefined;
    try {
      browser = await this.crearBrowser();
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
      await page.goto('https://www.espn.com/soccer/scoreboard', { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('.ScoreCell', { timeout: 10000 });

      return await page.evaluate(() =>
        Array.from(document.querySelectorAll('.ScoreCell'))
          .slice(0, 20)
          .map(el => ({
            equipo1: el.querySelectorAll('.ScoreCell__TeamName')[0]?.textContent?.trim() ?? '',
            equipo2: el.querySelectorAll('.ScoreCell__TeamName')[1]?.textContent?.trim() ?? '',
            marcador: el.querySelector('.ScoreCell__Score')?.textContent?.trim() || 'EN VIVO',
            hora: el.querySelector('.ScoreCell__Time')?.textContent?.trim() ?? '',
            fuente: 'ESPN',
          })),
      );
    } catch (error) {
      this.logger.warn(`ESPN error: ${(error as Error).message}`);
      return [];
    } finally {
      if (browser) await browser.close();
    }
  }

  async scrapearLivescore(): Promise<ResultadoPartido[]> {
    let browser: Browser | undefined;
    try {
      browser = await this.crearBrowser();
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
      await page.goto('https://www.livescore.com/en/football/', { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('[data-testid="match-row"]', { timeout: 10000 });

      return await page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-testid="match-row"]'))
          .slice(0, 20)
          .map(el => ({
            equipo1: el.querySelectorAll('[data-testid="match-row-team-name"]')[0]?.textContent?.trim() ?? '',
            equipo2: el.querySelectorAll('[data-testid="match-row-team-name"]')[1]?.textContent?.trim() ?? '',
            marcador: el.querySelector('[data-testid="match-row-score"]')?.textContent?.trim() || 'EN VIVO',
            hora: el.querySelector('[data-testid="match-row-status"]')?.textContent?.trim() ?? '',
            fuente: 'Livescore',
          })),
      );
    } catch (error) {
      this.logger.warn(`Livescore error: ${(error as Error).message}`);
      return [];
    } finally {
      if (browser) await browser.close();
    }
  }

  async scrapearGoal(): Promise<ResultadoPartido[]> {
    let browser: Browser | undefined;
    try {
      browser = await this.crearBrowser();
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
      await page.goto('https://www.goal.com/en/livescores', { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('.fixture', { timeout: 10000 });

      return await page.evaluate(() =>
        Array.from(document.querySelectorAll('.fixture'))
          .slice(0, 20)
          .map(el => ({
            equipo1: el.querySelectorAll('.team__name')[0]?.textContent?.trim() ?? '',
            equipo2: el.querySelectorAll('.team__name')[1]?.textContent?.trim() ?? '',
            marcador: el.querySelector('.fixture__score')?.textContent?.trim() || 'EN VIVO',
            hora: el.querySelector('.fixture__time')?.textContent?.trim() ?? '',
            fuente: 'Goal',
          })),
      );
    } catch (error) {
      this.logger.warn(`Goal error: ${(error as Error).message}`);
      return [];
    } finally {
      if (browser) await browser.close();
    }
  }

  async scrapingValidado(): Promise<ResultadoValidado[]> {
    this.logger.log('Iniciando scraping multi-fuente...');

    const resultados = await Promise.allSettled([
      this.scrapearFlashScore(),
      this.scrapearSofascore(),
      this.scrapearESPN(),
      this.scrapearLivescore(),
      this.scrapearGoal(),
    ]);

    const todasFuentes = resultados
      .filter((r): r is PromiseFulfilledResult<ResultadoPartido[]> => r.status === 'fulfilled' && r.value.length > 0)
      .map(r => r.value);

    if (todasFuentes.length === 0) {
      throw new Error('No se pudo obtener datos de ninguna fuente');
    }

    this.logger.log(`Fuentes exitosas: ${todasFuentes.length}/5`);

    const fuentePrincipal = todasFuentes[0];

    return fuentePrincipal.map(partido => {
      const fuentesQueCoinciden = [partido.fuente];

      for (let i = 1; i < todasFuentes.length; i++) {
        const match = todasFuentes[i].find(p =>
          this.equiposCoinciden(p.equipo1, partido.equipo1) &&
          this.equiposCoinciden(p.equipo2, partido.equipo2),
        );
        if (match && match.marcador === partido.marcador) {
          fuentesQueCoinciden.push(match.fuente);
        }
      }

      const confianza = fuentesQueCoinciden.length / todasFuentes.length;

      return {
        ...partido,
        validado: confianza >= 0.5,
        confianza: Math.round(confianza * 100) / 100,
        fuentesQueCoinciden,
      };
    });
  }

  async scrapingDinamico() {
    return this.scrapingValidado();
  }

  private async buscarEnFlashScore(equipo1: string, equipo2: string): Promise<ResultadoPartido | null> {
    let browser: Browser | undefined;
    try {
      browser = await this.crearBrowser();
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
      await page.goto(`https://www.flashscore.com/search/?q=${encodeURIComponent(equipo1)}`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await page.waitForSelector('div.event__match, .search-result', { timeout: 10000 });

      const resultado = await page.evaluate((e1: string, e2: string) => {
        const partidos = Array.from(document.querySelectorAll('div.event__match'));
        for (const el of partidos) {
          const eq1 = el.querySelectorAll('span.event__participant')[0]?.textContent?.trim() ?? '';
          const eq2 = el.querySelectorAll('span.event__participant')[1]?.textContent?.trim() ?? '';
          const norm = (s: string) => s.toLowerCase().trim();
          if (norm(eq1).includes(norm(e1)) || norm(eq2).includes(norm(e2))) {
            return {
              equipo1: eq1,
              equipo2: eq2,
              marcador: el.querySelector('span.event__score')?.textContent?.trim() || 'EN VIVO',
              hora: el.querySelector('span.event__time')?.textContent?.trim() ?? '',
              fuente: 'FlashScore',
            };
          }
        }
        return null;
      }, equipo1, equipo2);

      return resultado;
    } catch (error) {
      this.logger.warn(`FlashScore búsqueda error: ${(error as Error).message}`);
      return null;
    } finally {
      if (browser) await browser.close();
    }
  }

  private async buscarEnSofascore(equipo1: string, equipo2: string): Promise<ResultadoPartido | null> {
    let browser: Browser | undefined;
    try {
      browser = await this.crearBrowser();
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
      await page.goto(`https://www.sofascore.com/search/teams/${encodeURIComponent(equipo1)}`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await page.waitForSelector('[data-testid="event_cell"]', { timeout: 10000 });

      const resultado = await page.evaluate((e1: string, e2: string) => {
        const partidos = Array.from(document.querySelectorAll('[data-testid="event_cell"]'));
        for (const el of partidos) {
          const eq1 = el.querySelector('[data-testid="event_cell_home_team_name"]')?.textContent?.trim() ?? '';
          const eq2 = el.querySelector('[data-testid="event_cell_away_team_name"]')?.textContent?.trim() ?? '';
          const norm = (s: string) => s.toLowerCase().trim();
          if (norm(eq1).includes(norm(e1)) || norm(eq2).includes(norm(e2))) {
            return {
              equipo1: eq1,
              equipo2: eq2,
              marcador: el.querySelector('[data-testid="event_cell_score"]')?.textContent?.trim() || 'EN VIVO',
              hora: el.querySelector('[data-testid="event_cell_start_time"]')?.textContent?.trim() ?? '',
              fuente: 'Sofascore',
            };
          }
        }
        return null;
      }, equipo1, equipo2);

      return resultado;
    } catch (error) {
      this.logger.warn(`Sofascore búsqueda error: ${(error as Error).message}`);
      return null;
    } finally {
      if (browser) await browser.close();
    }
  }

  private async buscarEnLivescore(equipo1: string, equipo2: string): Promise<ResultadoPartido | null> {
    let browser: Browser | undefined;
    try {
      browser = await this.crearBrowser();
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
      await page.goto(`https://www.livescore.com/en/search/?q=${encodeURIComponent(equipo1)}`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await page.waitForSelector('[data-testid="match-row"]', { timeout: 10000 });

      const resultado = await page.evaluate((e1: string, e2: string) => {
        const partidos = Array.from(document.querySelectorAll('[data-testid="match-row"]'));
        for (const el of partidos) {
          const eq1 = el.querySelectorAll('[data-testid="match-row-team-name"]')[0]?.textContent?.trim() ?? '';
          const eq2 = el.querySelectorAll('[data-testid="match-row-team-name"]')[1]?.textContent?.trim() ?? '';
          const norm = (s: string) => s.toLowerCase().trim();
          if (norm(eq1).includes(norm(e1)) || norm(eq2).includes(norm(e2))) {
            return {
              equipo1: eq1,
              equipo2: eq2,
              marcador: el.querySelector('[data-testid="match-row-score"]')?.textContent?.trim() || 'EN VIVO',
              hora: el.querySelector('[data-testid="match-row-status"]')?.textContent?.trim() ?? '',
              fuente: 'Livescore',
            };
          }
        }
        return null;
      }, equipo1, equipo2);

      return resultado;
    } catch (error) {
      this.logger.warn(`Livescore búsqueda error: ${(error as Error).message}`);
      return null;
    } finally {
      if (browser) await browser.close();
    }
  }

  async buscarPartido(equipo1: string, equipo2: string): Promise<{
    encontrado: boolean;
    fuentes: ResultadoPartido[];
    validado: boolean;
    confianza: number;
    resumen: string;
  }> {
    this.logger.log(`Buscando partido: ${equipo1} vs ${equipo2}`);

    const resultados = await Promise.allSettled([
      this.buscarEnFlashScore(equipo1, equipo2),
      this.buscarEnSofascore(equipo1, equipo2),
      this.buscarEnLivescore(equipo1, equipo2),
    ]);

    const fuentes = resultados
      .filter((r): r is PromiseFulfilledResult<ResultadoPartido> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    const encontrado = fuentes.length > 0;
    const confianza = Math.round((fuentes.length / 3) * 100) / 100;
    const validado = fuentes.length >= 2;

    const marcadores = [...new Set(fuentes.map(f => f.marcador))];
    const marcadorConcordante = marcadores.length === 1 ? marcadores[0] : null;

    let resumen: string;
    if (!encontrado) {
      resumen = `Partido ${equipo1} vs ${equipo2} NO encontrado en ninguna fuente.`;
    } else if (validado && marcadorConcordante) {
      resumen = `Partido VALIDADO en ${fuentes.length}/3 fuentes. Marcador confirmado: ${marcadorConcordante}`;
    } else if (encontrado && !validado) {
      resumen = `Partido encontrado solo en ${fuentes.length}/3 fuente(s). Verificación insuficiente.`;
    } else {
      resumen = `Partido encontrado en ${fuentes.length}/3 fuentes pero marcadores discrepan: ${marcadores.join(' / ')}`;
    }

    return { encontrado, fuentes, validado, confianza, resumen };
  }
}
