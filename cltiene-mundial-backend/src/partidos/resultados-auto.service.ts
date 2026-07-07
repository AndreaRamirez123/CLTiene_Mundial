import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partido } from '../entities/partido.entity';
import { PartidosService } from './partidos.service';
import { PrediccionesService } from '../predicciones/predicciones.service';
import { EliminatoriasService } from './eliminatorias.service';
import { FootballScraperService } from './football-scraper.service';

@Injectable()
export class ResultadosAutoService {
  private readonly logger = new Logger(ResultadosAutoService.name);

  constructor(
    @InjectRepository(Partido)
    private readonly partidoRepo: Repository<Partido>,
    private readonly partidosService: PartidosService,
    private readonly prediccionesService: PrediccionesService,
    private readonly eliminatoriasService: EliminatoriasService,
    private readonly scraperService: FootballScraperService,
  ) {}

  @Cron('*/5 * * * *')
  async actualizarResultados() {
    const ahora = new Date();
    // Solo buscar partidos que empezaron hace más de 105 min (90 min partido + 15 margen)
    const umbral = new Date(ahora.getTime() - 105 * 60 * 1000);

    const pendientes = await this.partidoRepo.find({
      where: { estado: 'pendiente' },
      order: { fecha: 'ASC', hora: 'ASC' },
    });

    const candidatos = pendientes.filter((p) => {
      if (!p.fecha || !p.hora) return false;
      // Hora colombiana UTC-5
      const fechaHora = new Date(`${p.fecha}T${p.hora}:00-05:00`);
      if (isNaN(fechaHora.getTime())) return false;
      if (fechaHora > umbral) return false;
      const local = (p.local_equipo || '').toLowerCase();
      const vis = (p.visitante_equipo || '').toLowerCase();
      if (local.includes('tbd') || vis.includes('tbd')) return false;
      if (local.includes('playoff') || vis.includes('playoff')) return false;
      return true;
    });

    if (candidatos.length === 0) {
      return { mensaje: 'No hay partidos candidatos para actualizar', actualizados: 0 };
    }

    this.logger.log(`Buscando resultados para ${candidatos.length} partido(s)...`);
    const resultados: string[] = [];

    for (const partido of candidatos) {
      try {
        const found = await this.scraperService.buscarPartido(
          partido.local_equipo,
          partido.visitante_equipo,
          partido.fecha,
        );

        if (!found.encontrado || !found.finalizado || !found.marcador) {
          this.logger.log(`Sin resultado final aún: ${partido.local_equipo} vs ${partido.visitante_equipo}`);
          continue;
        }

        const parsed = this.parsearMarcador(found.marcador);
        if (!parsed) continue;

        await this.partidosService.actualizarResultado(
          String(partido.id),
          parsed.goles_local,
          parsed.goles_visitante,
          found.ganador || undefined,
          found.penales || undefined,
        );
        await this.prediccionesService.resolverPrediccionesPartido(partido.id);
        await this.eliminatoriasService.verificarYGenerarSiguienteFase(partido.empresa_id);

        const penInfo = found.penales ? ` (pen: ${found.penales})` : '';
        const msg = `${partido.local_equipo} ${parsed.goles_local}-${parsed.goles_visitante} ${partido.visitante_equipo}${penInfo} [${found.fuente}]`;
        resultados.push(msg);
        this.logger.log(`✅ ${msg}`);
      } catch (err) {
        this.logger.warn(`Error en ${partido.local_equipo} vs ${partido.visitante_equipo}: ${(err as Error).message}`);
      }
    }

    return {
      mensaje: `${resultados.length} partido(s) actualizados de ${candidatos.length} candidato(s)`,
      actualizados: resultados.length,
      resultados,
    };
  }

  private parsearMarcador(marcador: string): { goles_local: number; goles_visitante: number } | null {
    if (!marcador || marcador === 'EN VIVO') return null;
    const match = marcador.replace(/\s/g, '').match(/^(\d+)[-:](\d+)$/);
    if (!match) return null;
    return {
      goles_local: parseInt(match[1], 10),
      goles_visitante: parseInt(match[2], 10),
    };
  }
}
