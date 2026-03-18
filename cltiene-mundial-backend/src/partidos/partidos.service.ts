/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class PartidosService {
  constructor(private firebase: FirebaseService) {}

  private get db() { return this.firebase.getFirestore(); }

  async getPartidos(fase?: string) {
    let query = this.db.collection('partidos').orderBy('fecha');
    if (fase) query = query.where('fase', '==', fase) as any;
    const snap = await query.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async seedPartidos() {
    const partidos = [
  { grupo: 'A', local: 'Qatar',         bandera_l: 'qa', visitante: 'Ecuador',       bandera_v: 'ec', fecha: '2026-06-11', hora: '12:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'B', local: 'Inglaterra',    bandera_l: 'gb-eng', visitante: 'Irán',      bandera_v: 'ir', fecha: '2026-06-11', hora: '15:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'A', local: 'Senegal',       bandera_l: 'sn', visitante: 'Países Bajos', bandera_v: 'nl', fecha: '2026-06-11', hora: '18:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'B', local: 'Estados Unidos',bandera_l: 'us', visitante: 'Gales',         bandera_v: 'gb-wls', fecha: '2026-06-12', hora: '12:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'C', local: 'Argentina',     bandera_l: 'ar', visitante: 'Arabia S.',     bandera_v: 'sa', fecha: '2026-06-12', hora: '15:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'D', local: 'Dinamarca',     bandera_l: 'dk', visitante: 'Túnez',         bandera_v: 'tn', fecha: '2026-06-12', hora: '18:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'C', local: 'México',        bandera_l: 'mx', visitante: 'Polonia',       bandera_v: 'pl', fecha: '2026-06-13', hora: '12:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'D', local: 'Francia',       bandera_l: 'fr', visitante: 'Australia',     bandera_v: 'au', fecha: '2026-06-13', hora: '15:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'E', local: 'Alemania',      bandera_l: 'de', visitante: 'Japón',         bandera_v: 'jp', fecha: '2026-06-13', hora: '18:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'E', local: 'España',        bandera_l: 'es', visitante: 'Costa Rica',    bandera_v: 'cr', fecha: '2026-06-14', hora: '12:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'F', local: 'Bélgica',       bandera_l: 'be', visitante: 'Canadá',        bandera_v: 'ca', fecha: '2026-06-14', hora: '15:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'F', local: 'Brasil',        bandera_l: 'br', visitante: 'Serbia',        bandera_v: 'rs', fecha: '2026-06-14', hora: '18:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'G', local: 'Portugal',      bandera_l: 'pt', visitante: 'Ghana',         bandera_v: 'gh', fecha: '2026-06-15', hora: '12:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'G', local: 'Uruguay',       bandera_l: 'uy', visitante: 'Corea del Sur', bandera_v: 'kr', fecha: '2026-06-15', hora: '15:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'H', local: 'Colombia',      bandera_l: 'co', visitante: 'Marruecos',     bandera_v: 'ma', fecha: '2026-06-15', hora: '18:00', fase: 'Grupos', estado: 'pendiente' },
  { grupo: 'H', local: 'Croacia',       bandera_l: 'hr', visitante: 'Ecuador',       bandera_v: 'ec', fecha: '2026-06-16', hora: '12:00', fase: 'Grupos', estado: 'pendiente' },
];

    const batch = this.db.batch();
    partidos.forEach((p) => {
      const ref = this.db.collection('partidos').doc();
      batch.set(ref, { ...p, createdAt: new Date() });
    });
    await batch.commit();
    return { mensaje: `${partidos.length} partidos creados exitosamente` };
  }

  async actualizarResultado(id: string, goles_local: number, goles_visitante: number) {
    const resultado = goles_local > goles_visitante ? 'local'
      : goles_visitante > goles_local ? 'visitante' : 'empate';

    await this.db.collection('partidos').doc(id).update({
      goles_local, goles_visitante, resultado, estado: 'finalizado',
    });
    return { mensaje: 'Resultado actualizado' };
  }
}