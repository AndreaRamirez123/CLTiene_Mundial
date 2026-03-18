/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class MonedasService {
  constructor(private firebase: FirebaseService) {}

  private get db() {
    return this.firebase.getFirestore();
  }

  // Obtener saldo actual del jugador
  async getSaldo(uid: string): Promise<number> {
    const snap = await this.db.collection('jugadores').doc(uid).get();
    return snap.exists ? snap.data()!.monedas : 0;
  }

  // Registrar una transacción y actualizar saldo
  async registrarTransaccion(
    uid: string,
    monto: number,
    tipo: string,
    descripcion: string,
  ) {
    const jugadorRef = this.db.collection('jugadores').doc(uid);
    const transRef = this.db.collection('transacciones').doc();

    await this.db.runTransaction(async (t) => {
      const jugadorSnap = await t.get(jugadorRef);
      const saldoAnterior = jugadorSnap.exists
        ? jugadorSnap.data()!.monedas
        : 0;
      const saldoNuevo = Math.max(0, saldoAnterior + monto);

      t.update(jugadorRef, {
        monedas: saldoNuevo,
        ultimo_acceso: new Date(),
        nivel: this.calcularNivel(saldoNuevo),
      });

      t.set(transRef, {
        uid,
        tipo,
        monto,
        saldo_anterior: saldoAnterior,
        saldo_nuevo: saldoNuevo,
        descripcion,
        createdAt: new Date(),
      });
    });
  }

  // Bono diario según fase del mundial
  async reclamarBonoDiario(
    uid: string,
  ): Promise<{ monedas: number; mensaje: string }> {
    const hoy = new Date().toISOString().split('T')[0];
    const jugadorRef = this.db.collection('jugadores').doc(uid);
    const snap = await jugadorRef.get();
    const data = snap.data()!;

    if (data?.ultimo_bono_diario === hoy) {
      return {
        monedas: 0,
        mensaje: 'Ya reclamaste tu bono hoy. Vuelve mañana.',
      };
    }

    const bonoPorFase = this.getBonoPorFecha();

    await this.registrarTransaccion(
      uid,
      bonoPorFase,
      'bono_diario',
      `Bono diario - ${hoy}`,
    );
    await jugadorRef.update({ ultimo_bono_diario: hoy });

    return {
      monedas: bonoPorFase,
      mensaje: `¡Ganaste ${bonoPorFase} monedas de bono diario!`,
    };
  }

  // Bono por referido
  async aplicarBonoReferido(uid: string, uidReferidor: string) {
    await this.registrarTransaccion(
      uid,
      50,
      'bono_referido',
      'Bono por ser referido',
    );
    await this.registrarTransaccion(
      uidReferidor,
      50,
      'bono_referido',
      'Bono por referir un jugador',
    );
  }

  // Historial de transacciones
  async getHistorial(uid: string) {
    const snap = await this.db
      .collection('transacciones')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // Nivel según saldo
  private calcularNivel(monedas: number): string {
    if (monedas >= 500) return 'muy_activo';
    if (monedas >= 100) return 'activo';
    return 'inactivo';
  }

  // Bono diario según fase del mundial (basado en el PDF)
  private getBonoPorFecha(): number {
    const hoy = new Date();
    const fecha = hoy.toISOString().split('T')[0];

    // Zona de grupos - primeros días
    if (fecha >= '2026-06-11' && fecha <= '2026-06-23') return 10;
    if (fecha >= '2026-06-24' && fecha <= '2026-06-27') return 60;
    // Dieciseisavos
    if (fecha >= '2026-06-28' && fecha <= '2026-07-03') return 20;
    // Octavos
    if (fecha >= '2026-07-04' && fecha <= '2026-07-07') return 30;
    // Cuartos
    if (fecha >= '2026-07-09' && fecha <= '2026-07-11') return 40;
    // Semifinales
    if (fecha >= '2026-07-14' && fecha <= '2026-07-15') return 50;
    // Tercer puesto
    if (fecha === '2026-07-18') return 60;
    // Final
    if (fecha === '2026-07-19') return 70;

    return 10;
  }
}
