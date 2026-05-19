import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partido } from '../entities/partido.entity';
import { Empresa } from '../entities/empresa.entity';

interface TablaEquipo {
  equipo: string;
  bandera: string;
  puntos: number;
  gf: number;
  gc: number;
  dg: number;
}

export interface Clasificado extends TablaEquipo {
  grupo: string;
  posicion: number;
}

// FIFA 2026: fechas reales del torneo
const FECHAS = {
  Dieciseisavos: ['2026-06-28', '2026-06-29', '2026-06-30', '2026-07-01'],
  Octavos:       ['2026-07-04', '2026-07-05', '2026-07-06', '2026-07-07'],
  Cuartos:       ['2026-07-09', '2026-07-10'],
  Semifinales:   ['2026-07-13', '2026-07-14'],
  'Tercer puesto': ['2026-07-16'],
  Final:         ['2026-07-19'],
};

@Injectable()
export class EliminatoriasService {
  private readonly logger = new Logger(EliminatoriasService.name);

  constructor(
    @InjectRepository(Partido)
    private readonly partidoRepo: Repository<Partido>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
  ) {}

  // Corre el 28 de junio a las 07:00 Colombia (UTC-5 = 12:00 UTC)
  @Cron('0 12 28 6 *')
  async cronGenerarDieciseisavos() {
    this.logger.log('Cron: generando Dieciseisavos automáticamente');
    const empresas = await this.empresaRepo.find({ where: { estado: 'activa' } });
    for (const empresa of empresas) {
      try {
        await this.generarDieciseisavos(empresa.id);
      } catch (e) {
        this.logger.error(`Error generando Dieciseisavos empresa ${empresa.id}: ${e.message}`);
      }
    }
  }

  async generarDieciseisavos(empresaId: number) {
    const existentes = await this.partidoRepo.count({
      where: { empresa_id: empresaId, fase: 'Dieciseisavos' },
    });
    if (existentes > 0) {
      return { mensaje: 'Ya existen partidos de Dieciseisavos', creados: 0 };
    }

    const clasificados = await this.calcularClasificados(empresaId);
    const primeros  = clasificados.filter(c => c.posicion === 1);
    const segundos  = clasificados.filter(c => c.posicion === 2);
    const terceros  = clasificados
      .filter(c => c.posicion === 3)
      .sort((a, b) => b.puntos - a.puntos || b.dg - a.dg || b.gf - a.gf)
      .slice(0, 8);

    if (primeros.length < 12 || segundos.length < 12) {
      return { mensaje: 'No todos los grupos han terminado aún', creados: 0 };
    }

    const get = (grupo: string, pos: 1 | 2) =>
      clasificados.find(c => c.grupo === grupo && c.posicion === pos)!;

    // Bracket FIFA 2026: ganador grupo X vs segundo grupo Y
    const cruces: { local: Clasificado | TablaEquipo; vis: Clasificado | TablaEquipo; fechaIdx: number; hora: string }[] = [
      { local: get('A', 1), vis: get('B', 2), fechaIdx: 0, hora: '14:00' },
      { local: get('C', 1), vis: get('D', 2), fechaIdx: 0, hora: '18:00' },
      { local: get('E', 1), vis: get('F', 2), fechaIdx: 0, hora: '22:00' },
      { local: get('G', 1), vis: get('H', 2), fechaIdx: 1, hora: '14:00' },
      { local: get('I', 1), vis: get('J', 2), fechaIdx: 1, hora: '18:00' },
      { local: get('K', 1), vis: get('L', 2), fechaIdx: 1, hora: '22:00' },
      { local: get('B', 1), vis: get('A', 2), fechaIdx: 2, hora: '14:00' },
      { local: get('D', 1), vis: get('C', 2), fechaIdx: 2, hora: '18:00' },
      { local: get('F', 1), vis: get('E', 2), fechaIdx: 2, hora: '22:00' },
      { local: get('H', 1), vis: get('G', 2), fechaIdx: 3, hora: '14:00' },
      { local: get('J', 1), vis: get('I', 2), fechaIdx: 3, hora: '18:00' },
      { local: get('L', 1), vis: get('K', 2), fechaIdx: 3, hora: '22:00' },
      // 8 mejores terceros (4 partidos extra)
      ...(terceros.length >= 8 ? [
        { local: terceros[0], vis: terceros[1], fechaIdx: 0, hora: '20:00' },
        { local: terceros[2], vis: terceros[3], fechaIdx: 1, hora: '20:00' },
        { local: terceros[4], vis: terceros[5], fechaIdx: 2, hora: '20:00' },
        { local: terceros[6], vis: terceros[7], fechaIdx: 3, hora: '20:00' },
      ] : []),
    ];

    const fechas = FECHAS.Dieciseisavos;
    const entities = cruces
      .filter(c => c.local && c.vis)
      .map(c =>
        this.partidoRepo.create({
          empresa_id: empresaId,
          local_equipo: c.local.equipo,
          bandera_local: c.local.bandera,
          visitante_equipo: c.vis.equipo,
          bandera_visitante: c.vis.bandera,
          fecha: fechas[c.fechaIdx],
          hora: c.hora,
          fase: 'Dieciseisavos',
          estado: 'pendiente',
          grupo: null,
        } as Partial<Partido>),
      );

    await this.partidoRepo.save(entities);
    this.logger.log(`${entities.length} partidos de Dieciseisavos creados para empresa ${empresaId}`);
    return { mensaje: `${entities.length} partidos de Dieciseisavos creados`, creados: entities.length };
  }

  // Llamado automáticamente cuando se actualiza un resultado
  async verificarYGenerarSiguienteFase(empresaId: number) {
    const secuencia: { actual: string; siguiente: string; totalPartidos: number }[] = [
      { actual: 'Dieciseisavos', siguiente: 'Octavos',       totalPartidos: 16 },
      { actual: 'Octavos',       siguiente: 'Cuartos',       totalPartidos: 8  },
      { actual: 'Cuartos',       siguiente: 'Semifinales',   totalPartidos: 4  },
      { actual: 'Semifinales',   siguiente: 'Tercer puesto', totalPartidos: 2  },
    ];

    for (const { actual, siguiente, totalPartidos } of secuencia) {
      const partidosFase = await this.partidoRepo.find({
        where: { empresa_id: empresaId, fase: actual },
        order: { id: 'ASC' },
      });

      if (partidosFase.length !== totalPartidos) continue;
      if (partidosFase.some(p => p.estado !== 'finalizado')) continue;

      const yaExiste = await this.partidoRepo.count({
        where: { empresa_id: empresaId, fase: siguiente },
      });
      if (yaExiste > 0) continue;

      if (siguiente === 'Tercer puesto') {
        await this.crearTercerPuestoYFinal(empresaId, partidosFase);
      } else {
        await this.crearSiguienteFase(empresaId, siguiente, partidosFase);
      }
    }
  }

  private async crearSiguienteFase(empresaId: number, fase: string, partidosAnteriores: Partido[]) {
    const fechas = FECHAS[fase] ?? [];
    const ganadores = partidosAnteriores.map(p => ({
      equipo:  p.resultado === 'local' ? p.local_equipo    : p.visitante_equipo,
      bandera: p.resultado === 'local' ? p.bandera_local   : p.bandera_visitante,
    }));

    const horas = ['14:00', '18:00', '22:00'];
    const entities: Partial<Partido>[] = [];

    for (let i = 0; i < ganadores.length; i += 2) {
      if (!ganadores[i] || !ganadores[i + 1]) continue;
      const diaIdx  = Math.floor(i / 2) % fechas.length;
      const horaIdx = Math.floor(i / 2) % horas.length;
      entities.push({
        empresa_id: empresaId,
        local_equipo:      ganadores[i].equipo,
        bandera_local:     ganadores[i].bandera,
        visitante_equipo:  ganadores[i + 1].equipo,
        bandera_visitante: ganadores[i + 1].bandera,
        fecha:  fechas[diaIdx] ?? fechas[fechas.length - 1],
        hora:   horas[horaIdx],
        fase,
        estado: 'pendiente',
        grupo:  null,
      });
    }

    const saved = await this.partidoRepo.save(entities.map(e => this.partidoRepo.create(e)));
    this.logger.log(`${saved.length} partidos de ${fase} creados para empresa ${empresaId}`);
    return saved;
  }

  private async crearTercerPuestoYFinal(empresaId: number, semis: Partido[]) {
    // Perdedores de semis → tercer puesto; ganadores → final
    const perdedores = semis.map(p => ({
      equipo:  p.resultado === 'local' ? p.visitante_equipo : p.local_equipo,
      bandera: p.resultado === 'local' ? p.bandera_visitante : p.bandera_local,
    }));
    const ganadores = semis.map(p => ({
      equipo:  p.resultado === 'local' ? p.local_equipo    : p.visitante_equipo,
      bandera: p.resultado === 'local' ? p.bandera_local   : p.bandera_visitante,
    }));

    const partidos = [
      {
        empresa_id: empresaId,
        local_equipo: perdedores[0].equipo, bandera_local: perdedores[0].bandera,
        visitante_equipo: perdedores[1].equipo, bandera_visitante: perdedores[1].bandera,
        fecha: FECHAS['Tercer puesto'][0], hora: '14:00',
        fase: 'Tercer puesto', estado: 'pendiente', grupo: null,
      },
      {
        empresa_id: empresaId,
        local_equipo: ganadores[0].equipo, bandera_local: ganadores[0].bandera,
        visitante_equipo: ganadores[1].equipo, bandera_visitante: ganadores[1].bandera,
        fecha: FECHAS['Final'][0], hora: '18:00',
        fase: 'Final', estado: 'pendiente', grupo: null,
      },
    ];

    const saved = await this.partidoRepo.save(partidos.map(p => this.partidoRepo.create(p as Partial<Partido>)));
    this.logger.log(`Tercer puesto y Final creados para empresa ${empresaId}`);
    return saved;
  }

  private async calcularClasificados(empresaId: number): Promise<Clasificado[]> {
    const partidos = await this.partidoRepo.find({
      where: { empresa_id: empresaId, fase: 'Grupos', estado: 'finalizado' },
    });

    const grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const clasificados: Clasificado[] = [];

    for (const grupo of grupos) {
      const tabla = this.calcularTabla(partidos.filter(p => p.grupo === grupo));
      tabla.forEach((e, idx) => clasificados.push({ ...e, grupo, posicion: idx + 1 }));
    }

    return clasificados;
  }

  private calcularTabla(partidos: Partido[]): TablaEquipo[] {
    const mapa: Record<string, TablaEquipo> = {};

    const asegurar = (equipo: string, bandera: string) => {
      if (!mapa[equipo]) mapa[equipo] = { equipo, bandera, puntos: 0, gf: 0, gc: 0, dg: 0 };
    };

    for (const p of partidos) {
      asegurar(p.local_equipo, p.bandera_local);
      asegurar(p.visitante_equipo, p.bandera_visitante);

      const gl = p.goles_local ?? 0;
      const gv = p.goles_visitante ?? 0;

      mapa[p.local_equipo].gf += gl;
      mapa[p.local_equipo].gc += gv;
      mapa[p.visitante_equipo].gf += gv;
      mapa[p.visitante_equipo].gc += gl;

      if (p.resultado === 'local') {
        mapa[p.local_equipo].puntos += 3;
      } else if (p.resultado === 'visitante') {
        mapa[p.visitante_equipo].puntos += 3;
      } else if (p.resultado === 'empate') {
        mapa[p.local_equipo].puntos += 1;
        mapa[p.visitante_equipo].puntos += 1;
      }
    }

    return Object.values(mapa)
      .map(e => ({ ...e, dg: e.gf - e.gc }))
      .sort((a, b) => b.puntos - a.puntos || b.dg - a.dg || b.gf - a.gf);
  }

  async obtenerClasificados(empresaId: number) {
    return this.calcularClasificados(empresaId);
  }
}
