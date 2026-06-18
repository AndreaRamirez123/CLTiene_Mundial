import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Jugador } from '../entities/jugador.entity';
import { Prediccion } from '../entities/prediccion.entity';
import { Partido } from '../entities/partido.entity';
import {
  actualizarRachaDeAcceso,
  calcularNivelActividad,
} from '../users/nivel-actividad.util';

// Goles otorgados por tipo de acierto (sistema del Mundial → ranking)
const GOLES_POR_RESULTADO_SIMPLE = 1;
const GOLES_POR_MARCADOR_EXACTO = 3;

// Cierre de predicciones: minutos antes del inicio del partido
const MINUTOS_CIERRE_PREDICCION = 5;

@Injectable()
export class PrediccionesService {
  private readonly logger = new Logger(PrediccionesService.name);

  constructor(
    @InjectRepository(Jugador)
    private readonly jugadorRepo: Repository<Jugador>,
    @InjectRepository(Prediccion)
    private readonly prediccionRepo: Repository<Prediccion>,
    @InjectRepository(Partido)
    private readonly partidoRepo: Repository<Partido>,
    private readonly dataSource: DataSource,
  ) {}

  // Convierte fecha (YYYY-MM-DD) + hora (HH:MM) en zona Colombia (UTC-5) a Date UTC
  private getInicioPartido(partido: Partido): Date {
    const [year, month, day] = partido.fecha.split('-').map(Number);
    const [hour, minute] = (partido.hora || '00:00').split(':').map(Number);
    // Colombia es UTC-5 sin DST → para convertir hora local a UTC, sumamos 5h
    return new Date(Date.UTC(year, month - 1, day, hour + 5, minute));
  }

  // Lanza BadRequestException si faltan menos de MINUTOS_CIERRE_PREDICCION para el inicio
  private validarTiempoPrediccion(partido: Partido): void {
    const inicio = this.getInicioPartido(partido);
    const minutosFaltantes = (inicio.getTime() - Date.now()) / 60000;
    if (minutosFaltantes < MINUTOS_CIERRE_PREDICCION) {
      throw new BadRequestException(
        `Predicciones cerradas para este partido. Faltan menos de ${MINUTOS_CIERRE_PREDICCION} minutos para el inicio.`,
      );
    }
  }

  async crearPrediccion(
    uid: string,
    datos: {
      partido_id: string;
      resultado: string;
      goles_local: number;
      goles_visitante: number;
    },
  ) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) {
      throw new BadRequestException('Jugador no encontrado');
    }

    const partidoId = parseInt(datos.partido_id, 10);
    const partido = await this.partidoRepo.findOne({
      where: { id: partidoId },
    });
    if (!partido) {
      throw new BadRequestException('Partido no encontrado');
    }

    // Bloquear si faltan menos de 5 minutos para el inicio
    this.validarTiempoPrediccion(partido);

    const existente = await this.prediccionRepo.findOne({
      where: { jugador_id: jugador.id, partido_id: partidoId },
    });

    if (existente) {
      throw new BadRequestException(
        'Ya tienes una predicción para este partido. Puedes editarla desde "Mis predicciones".',
      );
    }

    let prediccion: Prediccion;

    await this.dataSource.transaction(async (manager) => {
      prediccion = await manager.save(Prediccion, {
        jugador_id: jugador.id,
        partido_id: partidoId,
        resultado: datos.resultado,
        goles_local: datos.goles_local,
        goles_visitante: datos.goles_visitante,
        estado: 'pendiente',
      });

      jugador.predicciones_count = (jugador.predicciones_count || 0) + 1;
      actualizarRachaDeAcceso(jugador);
      jugador.nivel = calcularNivelActividad(jugador);
      await manager.save(Jugador, jugador);
    });

    return {
      mensaje: 'Predicción guardada. Buena suerte.',
      id: prediccion!.id,
    };
  }

  async editarPrediccion(
    uid: string,
    partidoId: number,
    datos: {
      resultado: string;
      goles_local: number;
      goles_visitante: number;
    },
  ) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) {
      throw new BadRequestException('Jugador no encontrado');
    }

    const partido = await this.partidoRepo.findOne({
      where: { id: partidoId },
    });
    if (!partido) {
      throw new BadRequestException('Partido no encontrado');
    }

    const prediccion = await this.prediccionRepo.findOne({
      where: { jugador_id: jugador.id, partido_id: partidoId },
    });
    if (!prediccion) {
      throw new BadRequestException(
        'No tienes una predicción para este partido',
      );
    }

    if (prediccion.estado !== 'pendiente') {
      throw new BadRequestException(
        'No puedes editar una predicción ya resuelta',
      );
    }

    // Bloquear si faltan menos de 5 minutos para el inicio
    this.validarTiempoPrediccion(partido);

    prediccion.resultado = datos.resultado;
    prediccion.goles_local = datos.goles_local;
    prediccion.goles_visitante = datos.goles_visitante;
    await this.prediccionRepo.save(prediccion);

    return {
      mensaje:
        'Predicción actualizada. Recuerda que no podrás modificarla 5 minutos antes del partido.',
      id: prediccion.id,
    };
  }

  async getPrediccionesUsuario(uid: string) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) return [];

    return this.prediccionRepo.find({
      where: { jugador_id: jugador.id },
      relations: ['partido'],
      order: { created_at: 'DESC' },
    });
  }

  async resolverPrediccionesPartido(partidoId: number) {
    const partido = await this.partidoRepo.findOne({
      where: { id: partidoId },
    });
    if (!partido || partido.estado !== 'finalizado' || !partido.resultado) {
      throw new BadRequestException(
        'El partido no está finalizado o no tiene resultado',
      );
    }

    const predicciones = await this.prediccionRepo.find({
      where: { partido_id: partidoId, estado: 'pendiente' },
    });

    if (predicciones.length === 0) {
      return {
        mensaje: 'No hay predicciones pendientes para este partido',
        resueltas: 0,
      };
    }

    let acertadasSimple = 0;
    let acertadasEspecial = 0;
    let fallidas = 0;

    for (const pred of predicciones) {
      await this.dataSource.transaction(async (manager) => {
        const jugador = await manager.findOne(Jugador, {
          where: { id: pred.jugador_id },
        });
        if (!jugador) return;

        const aciertoSimple = pred.resultado === partido.resultado;
        const aciertoEspecial =
          aciertoSimple &&
          pred.goles_local === partido.goles_local &&
          pred.goles_visitante === partido.goles_visitante;

        let golesGanados = 0;
        let estado: string;

        if (aciertoEspecial) {
          golesGanados = GOLES_POR_MARCADOR_EXACTO;
          estado = 'acertada_especial';
          acertadasEspecial++;
        } else if (aciertoSimple) {
          golesGanados = GOLES_POR_RESULTADO_SIMPLE;
          estado = 'acertada_simple';
          acertadasSimple++;
        } else {
          estado = 'fallida';
          fallidas++;
        }

        pred.estado = estado;
        pred.goles_ganados = golesGanados;
        await manager.save(Prediccion, pred);

        if (golesGanados > 0) {
          jugador.goles = (jugador.goles || 0) + golesGanados;
          jugador.predicciones_acertadas =
            (jugador.predicciones_acertadas || 0) + 1;
          jugador.nivel = calcularNivelActividad(jugador);
          await manager.save(Jugador, jugador);
        }
      });
    }

    this.logger.log(
      `Partido ${partidoId} resuelto: ${acertadasSimple} simples, ${acertadasEspecial} especiales, ${fallidas} fallidas`,
    );

    return {
      mensaje: `Predicciones resueltas para ${partido.local_equipo} vs ${partido.visitante_equipo}`,
      acertadas_simple: acertadasSimple,
      acertadas_especial: acertadasEspecial,
      fallidas,
      total: predicciones.length,
    };
  }

  async reEvaluarPrediccionesPartido(partidoId: number, goles_local: number, goles_visitante: number) {
    const resultado =
      goles_local > goles_visitante ? 'local'
        : goles_visitante > goles_local ? 'visitante'
          : 'empate';

    // 1. Deshacer evaluaciones anteriores
    const predicciones = await this.prediccionRepo.find({ where: { partido_id: partidoId } });
    for (const pred of predicciones) {
      if (pred.estado !== 'pendiente') {
        await this.dataSource.transaction(async (manager) => {
          const jugador = await manager.findOne(Jugador, { where: { id: pred.jugador_id } });
          if (!jugador) return;
          if (pred.goles_ganados > 0) {
            jugador.goles = Math.max(0, (jugador.goles || 0) - pred.goles_ganados);
            jugador.predicciones_acertadas = Math.max(0, (jugador.predicciones_acertadas || 0) - 1);
            await manager.save(Jugador, jugador);
          }
          pred.estado = 'pendiente';
          pred.goles_ganados = 0;
          await manager.save(Prediccion, pred);
        });
      }
    }

    // 2. Actualizar resultado del partido
    await this.partidoRepo.update(partidoId, { goles_local, goles_visitante, resultado, estado: 'finalizado' });

    // 3. Re-evaluar con el resultado correcto
    return this.resolverPrediccionesPartido(partidoId);
  }

  async simularResultado(
    partidoId: number,
    golesLocal: number,
    golesVisitante: number,
  ) {
    const resultado =
      golesLocal > golesVisitante
        ? 'local'
        : golesVisitante > golesLocal
          ? 'visitante'
          : 'empate';

    await this.partidoRepo.update(partidoId, {
      goles_local: golesLocal,
      goles_visitante: golesVisitante,
      resultado,
      estado: 'finalizado',
    });

    const resolucion = await this.resolverPrediccionesPartido(partidoId);
    const partido = await this.partidoRepo.findOne({
      where: { id: partidoId },
    });

    return {
      partido: `${partido?.local_equipo} ${golesLocal} - ${golesVisitante} ${partido?.visitante_equipo}`,
      resultado,
      ...resolucion,
    };
  }
}
