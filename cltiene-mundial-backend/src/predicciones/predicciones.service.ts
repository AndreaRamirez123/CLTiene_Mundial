import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Jugador } from '../entities/jugador.entity';
import { Prediccion } from '../entities/prediccion.entity';
import { Partido } from '../entities/partido.entity';
import { Transaccion } from '../entities/transaccion.entity';
import { calcularNivelActividad } from '../users/nivel-actividad.util';

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

  async crearPrediccion(
    uid: string,
    datos: {
      partido_id: string;
      resultado: string;
      goles_local: number;
      goles_visitante: number;
      monedas_apostadas: number;
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

    const existente = await this.prediccionRepo.findOne({
      where: { jugador_id: jugador.id, partido_id: partidoId },
    });

    if (existente) {
      throw new BadRequestException(
        'Ya tienes una predicción para este partido',
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
      jugador.ultimo_acceso = new Date();
      jugador.nivel = calcularNivelActividad(jugador);
      await manager.save(Jugador, jugador);
    });

    return {
      mensaje: 'Predicción guardada. Buena suerte.',
      id: prediccion!.id,
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

        let monedasGanadas = 0;
        let estado: string;
        let tipo: string;

        if (aciertoEspecial) {
          monedasGanadas = 100;
          estado = 'acertada_especial';
          tipo = 'prediccion_especial';
          acertadasEspecial++;
        } else if (aciertoSimple) {
          monedasGanadas = 50;
          estado = 'acertada_simple';
          tipo = 'prediccion_simple';
          acertadasSimple++;
        } else {
          estado = 'fallida';
          tipo = '';
          fallidas++;
        }

        pred.estado = estado;
        pred.monedas_ganadas = monedasGanadas;
        await manager.save(Prediccion, pred);

        if (monedasGanadas > 0) {
          const saldoAnterior = jugador.monedas;
          const saldoNuevo = saldoAnterior + monedasGanadas;

          jugador.monedas = saldoNuevo;
          jugador.monedas_totales_ganadas =
            (jugador.monedas_totales_ganadas || 0) + monedasGanadas;
          jugador.predicciones_acertadas =
            (jugador.predicciones_acertadas || 0) + 1;
          jugador.ultimo_acceso = new Date();
          jugador.nivel = calcularNivelActividad(jugador);
          await manager.save(Jugador, jugador);

          await manager.save(Transaccion, {
            jugador_id: jugador.id,
            tipo,
            monto: monedasGanadas,
            saldo_anterior: saldoAnterior,
            saldo_nuevo: saldoNuevo,
            descripcion: `${aciertoEspecial ? 'Marcador exacto' : 'Resultado acertado'}: ${partido.local_equipo} vs ${partido.visitante_equipo}`,
            referencia_id: partido.id,
          });
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
