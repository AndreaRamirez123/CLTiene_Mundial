import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Jugador } from '../entities/jugador.entity';
import { Transaccion } from '../entities/transaccion.entity';
import {
  actualizarRachaDeAcceso,
  calcularNivelActividad,
  fechaColombiaISO,
} from '../users/nivel-actividad.util';

@Injectable()
export class MonedasService {
  constructor(
    @InjectRepository(Jugador)
    private readonly jugadorRepo: Repository<Jugador>,
    @InjectRepository(Transaccion)
    private readonly transaccionRepo: Repository<Transaccion>,
    private readonly dataSource: DataSource,
  ) {}

  async getSaldo(uid: string): Promise<number> {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    return jugador ? jugador.monedas : 0;
  }

  async registrarTransaccion(
    uid: string,
    monto: number,
    tipo: string,
    descripcion: string,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const jugador = await manager.findOne(Jugador, { where: { uid } });
      if (!jugador) {
        throw new BadRequestException('Jugador no encontrado');
      }

      const saldoAnterior = jugador.monedas;
      const saldoNuevo = saldoAnterior + Math.max(0, monto);

      await manager.save(Transaccion, {
        jugador_id: jugador.id,
        tipo,
        monto: Math.max(0, monto),
        saldo_anterior: saldoAnterior,
        saldo_nuevo: saldoNuevo,
        descripcion,
      });

      jugador.monedas = saldoNuevo;
      jugador.monedas_totales_ganadas =
        (jugador.monedas_totales_ganadas || 0) + Math.max(0, monto);
      actualizarRachaDeAcceso(jugador);
      jugador.nivel = calcularNivelActividad(jugador);

      await manager.save(Jugador, jugador);
    });
  }

  async reclamarBonoDiario(
    uid: string,
  ): Promise<{ monedas: number; mensaje: string }> {
    const hoy = fechaColombiaISO();
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });

    if (!jugador) {
      throw new BadRequestException('Jugador no encontrado');
    }

    if (jugador.ultimo_bono_diario === hoy) {
      return {
        monedas: 0,
        mensaje: 'Ya reclamaste tu bono hoy. Vuelve mañana.',
      };
    }

    const bonoPorFase = this.getBonoPorFecha();

    await this.dataSource.transaction(async (manager) => {
      const jug = await manager.findOne(Jugador, { where: { uid } });
      if (!jug) return;

      const saldoAnterior = jug.monedas;
      const saldoNuevo = saldoAnterior + bonoPorFase;

      await manager.save(Transaccion, {
        jugador_id: jug.id,
        tipo: 'bono_diario',
        monto: bonoPorFase,
        saldo_anterior: saldoAnterior,
        saldo_nuevo: saldoNuevo,
        descripcion: `Bono diario - ${hoy}`,
      });

      jug.monedas = saldoNuevo;
      jug.monedas_totales_ganadas =
        (jug.monedas_totales_ganadas || 0) + bonoPorFase;
      jug.ultimo_bono_diario = hoy;
      actualizarRachaDeAcceso(jug);
      jug.nivel = calcularNivelActividad(jug);

      await manager.save(Jugador, jug);
    });

    return {
      monedas: bonoPorFase,
      mensaje: `Ganaste ${bonoPorFase} monedas de bono diario.`,
    };
  }

  async aplicarBonoReferido(uid: string, uidReferidor: string) {
    await this.dataSource.transaction(async (manager) => {
      const jugador = await manager.findOne(Jugador, { where: { uid } });
      if (!jugador) {
        throw new BadRequestException('Jugador referido no encontrado');
      }

      const saldoAnterior1 = jugador.monedas;
      const saldoNuevo1 = saldoAnterior1 + 50;

      await manager.save(Transaccion, {
        jugador_id: jugador.id,
        tipo: 'bono_referido',
        monto: 50,
        saldo_anterior: saldoAnterior1,
        saldo_nuevo: saldoNuevo1,
        descripcion: 'Bono por ser referido',
      });

      jugador.monedas = saldoNuevo1;
      jugador.monedas_totales_ganadas =
        (jugador.monedas_totales_ganadas || 0) + 50;
      actualizarRachaDeAcceso(jugador);
      jugador.nivel = calcularNivelActividad(jugador);
      await manager.save(Jugador, jugador);

      const referidor = await manager.findOne(Jugador, {
        where: { uid: uidReferidor },
      });
      if (!referidor) {
        throw new BadRequestException('Jugador referidor no encontrado');
      }

      const saldoAnterior2 = referidor.monedas;
      const saldoNuevo2 = saldoAnterior2 + 50;

      await manager.save(Transaccion, {
        jugador_id: referidor.id,
        tipo: 'bono_referido',
        monto: 50,
        saldo_anterior: saldoAnterior2,
        saldo_nuevo: saldoNuevo2,
        descripcion: 'Bono por referir un jugador',
      });

      referidor.monedas = saldoNuevo2;
      referidor.monedas_totales_ganadas =
        (referidor.monedas_totales_ganadas || 0) + 50;
      referidor.nivel = calcularNivelActividad(referidor);
      await manager.save(Jugador, referidor);
    });
  }

  async getHistorial(uid: string) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) return [];

    return this.transaccionRepo.find({
      where: { jugador_id: jugador.id },
      order: { created_at: 'DESC' },
      take: 20,
    });
  }

  getBonoPorFecha(): number {
    const fecha = fechaColombiaISO();

    if (fecha >= '2026-06-11' && fecha <= '2026-06-23') return 10;
    if (fecha >= '2026-06-24' && fecha <= '2026-06-27') return 60;
    if (fecha >= '2026-06-28' && fecha <= '2026-07-03') return 20;
    if (fecha >= '2026-07-04' && fecha <= '2026-07-07') return 30;
    if (fecha >= '2026-07-09' && fecha <= '2026-07-11') return 40;
    if (fecha >= '2026-07-14' && fecha <= '2026-07-15') return 50;
    if (fecha === '2026-07-18') return 60;
    if (fecha === '2026-07-19') return 70;

    return 10;
  }
}
