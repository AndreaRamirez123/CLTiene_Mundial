/* eslint-disable @typescript-eslint/require-await */

import { Injectable, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class PrediccionesService {
  constructor(private firebase: FirebaseService) {}

  private get db() {
    return this.firebase.getFirestore();
  }

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
    // Validar minimo de monedas
    if (datos.monedas_apostadas < 10) {
      throw new BadRequestException('El mínimo de monedas por apuesta es 10');
    }

    // Verificar saldo suficiente
    const jugadorSnap = await this.db.collection('jugadores').doc(uid).get();
    if (!jugadorSnap.exists)
      throw new BadRequestException('Jugador no encontrado');

    const saldo = jugadorSnap.data()!.monedas as number;
    if (saldo < datos.monedas_apostadas) {
      throw new BadRequestException('No tienes suficientes monedas');
    }

    // Verificar que no exista predicción previa para este partido
    const existente = await this.db
      .collection('predicciones')
      .where('uid', '==', uid)
      .where('partido_id', '==', datos.partido_id)
      .get();

    if (!existente.empty) {
      throw new BadRequestException(
        'Ya tienes una predicción para este partido',
      );
    }

    // Guardar predicción sin descontar monedas
    const predRef = this.db.collection('predicciones').doc();
    const jugadorRef = this.db.collection('jugadores').doc(uid);

    await this.db.runTransaction(async (t) => {
      t.set(predRef, {
        uid,
        partido_id: datos.partido_id,
        resultado: datos.resultado,
        goles_local: datos.goles_local,
        goles_visitante: datos.goles_visitante,
        estado: 'pendiente',
        createdAt: new Date(),
      });

      t.update(jugadorRef, {
        predicciones: (jugadorSnap.data()!.predicciones || 0) + 1,
        ultimo_acceso: new Date(),
      });
    });

    return { mensaje: '¡Predicción guardada! Buena suerte 🍀', id: predRef.id };
  }

  async getPrediccionesUsuario(uid: string) {
    const snap = await this.db
      .collection('predicciones')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}
