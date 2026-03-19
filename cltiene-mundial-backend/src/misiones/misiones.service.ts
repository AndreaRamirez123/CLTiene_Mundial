/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Injectable, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

interface Mision {
  id: string;
  icono: string;
  titulo: string;
  desc: string;
  goles: number;
  tipo: 'auto' | 'manual';
}

const MISIONES: Mision[] = [
  {
    id: 'perfil_creado',
    icono: '✅',
    titulo: 'Perfil creado',
    desc: 'Completaste tu registro',
    goles: 10,
    tipo: 'auto',
  },
  {
    id: 'primera_prediccion',
    icono: '⚽',
    titulo: 'Primera predicción',
    desc: 'Predice tu primer partido',
    goles: 5,
    tipo: 'auto',
  },
  {
    id: 'invita_amigo',
    icono: '🤝',
    titulo: 'Invita un amigo',
    desc: 'Un amigo se registró con tu código',
    goles: 5,
    tipo: 'auto',
  },
  {
    id: 'ver_video',
    icono: '▶️',
    titulo: 'Ver video CLTiene',
    desc: 'Mira un video de la marca',
    goles: 3,
    tipo: 'manual',
  },
  {
    id: 'trivia_mundial',
    icono: '🧠',
    titulo: 'Trivia del Mundial',
    desc: 'Juega la trivia diaria de fútbol',
    goles: 4,
    tipo: 'auto',
  },
  {
    id: 'siete_dias',
    icono: '🔥',
    titulo: '7 días seguidos',
    desc: 'Ingresa 7 días consecutivos',
    goles: 7,
    tipo: 'auto',
  },
];

@Injectable()
export class MisionesService {
  constructor(private firebase: FirebaseService) {}

  private get db() {
    return this.firebase.getFirestore();
  }

  async getMisiones(uid: string) {
    const jugadorRef = this.db.collection('jugadores').doc(uid);
    const jugadorSnap = await jugadorRef.get();
    if (!jugadorSnap.exists) {
      throw new BadRequestException('Jugador no encontrado');
    }

    const data = jugadorSnap.data()!;
    const completadas: string[] = data.misiones_completadas || [];

    // Auto-detectar misiones completables
    const autoCompletadas = await this.detectarAutoCompletadas(uid, data);

    // Encontrar misiones auto-detectadas que aún no fueron registradas
    const nuevas = autoCompletadas.filter((id) => !completadas.includes(id));

    // Si hay nuevas misiones auto-completadas, otorgar goles y registrarlas
    if (nuevas.length > 0) {
      const golesGanados = nuevas.reduce((sum, id) => {
        const mision = MISIONES.find((m) => m.id === id);
        return sum + (mision?.goles || 0);
      }, 0);

      const golesActuales = data.goles || 0;
      const todasCompletadasArr = [...completadas, ...nuevas];

      await jugadorRef.update({
        misiones_completadas: todasCompletadasArr,
        goles: golesActuales + golesGanados,
      });

      // Usar datos actualizados para la respuesta
      const lista = MISIONES.map((m) => ({
        ...m,
        ok: todasCompletadasArr.includes(m.id),
      }));
      const totalCompletadas = lista.filter((m) => m.ok).length;

      return {
        misiones: lista,
        completadas: totalCompletadas,
        total: lista.length,
        goles_otorgados: golesGanados,
      };
    }

    // Combinar completadas manuales + auto-detectadas
    const todasCompletadas = [
      ...new Set([...completadas, ...autoCompletadas]),
    ];

    const lista = MISIONES.map((m) => ({
      ...m,
      ok: todasCompletadas.includes(m.id),
    }));

    const totalCompletadas = lista.filter((m) => m.ok).length;

    return { misiones: lista, completadas: totalCompletadas, total: lista.length };
  }

  async completarMision(uid: string, misionId: string) {
    const mision = MISIONES.find((m) => m.id === misionId);
    if (!mision) {
      throw new BadRequestException('Misión no encontrada');
    }

    const jugadorRef = this.db.collection('jugadores').doc(uid);
    const jugadorSnap = await jugadorRef.get();
    if (!jugadorSnap.exists) {
      throw new BadRequestException('Jugador no encontrado');
    }

    const data = jugadorSnap.data()!;
    const completadas: string[] = data.misiones_completadas || [];

    if (completadas.includes(misionId)) {
      throw new BadRequestException('Ya completaste esta misión');
    }

    // Validar que la misión se puede completar
    const puedeCompletar = await this.validarMision(uid, misionId, data);
    if (!puedeCompletar) {
      throw new BadRequestException(
        'Aún no cumples los requisitos para completar esta misión',
      );
    }

    // Otorgar goles y registrar misión completada
    const golesActuales = data.goles || 0;
    await jugadorRef.update({
      misiones_completadas: [...completadas, misionId],
      goles: golesActuales + mision.goles,
      ultimo_acceso: new Date(),
    });

    return {
      mensaje: `¡Misión "${mision.titulo}" completada! +${mision.goles} ⚽`,
      goles_ganados: mision.goles,
      goles_total: golesActuales + mision.goles,
    };
  }

  async jugarTrivia(uid: string, correctas: number) {
    const hoy = new Date().toISOString().split('T')[0];
    const jugadorRef = this.db.collection('jugadores').doc(uid);
    const jugadorSnap = await jugadorRef.get();

    if (!jugadorSnap.exists) {
      throw new BadRequestException('Jugador no encontrado');
    }

    const data = jugadorSnap.data()!;

    // Verificar si ya jugó hoy
    if (data.ultimo_trivia === hoy) {
      throw new BadRequestException(
        'Ya jugaste la trivia hoy. ¡Vuelve mañana para ganar más goles!',
      );
    }

    
    const golesGanados = Math.max(1, correctas);
    const golesActuales = data.goles || 0;
    const totalTrivias = (data.trivias_jugadas || 0) + 1;

    const updateData: Record<string, unknown> = {
      goles: golesActuales + golesGanados,
      ultimo_trivia: hoy,
      trivias_jugadas: totalTrivias,
      ultimo_acceso: new Date(),
    };

    // Completar la misión en la primera vez
    const completadas: string[] = data.misiones_completadas || [];
    if (!completadas.includes('trivia_mundial')) {
      const mision = MISIONES.find((m) => m.id === 'trivia_mundial')!;
      const golesConMision = golesGanados + mision.goles;
      updateData.misiones_completadas = [...completadas, 'trivia_mundial'];
      updateData.goles = golesActuales + golesConMision;

      await jugadorRef.update(updateData);

      return {
        mensaje: `¡Trivia completada! +${golesConMision} ⚽ (${correctas}/5 correctas + bono primera vez)`,
        goles_ganados: golesConMision,
        correctas,
        primera_vez: true,
      };
    }

    await jugadorRef.update(updateData);

    return {
      mensaje: `¡Trivia completada! +${golesGanados} ⚽ (${correctas}/5 correctas)`,
      goles_ganados: golesGanados,
      correctas,
      primera_vez: false,
    };
  }

  private async detectarAutoCompletadas(
    uid: string,
    data: FirebaseFirestore.DocumentData,
  ): Promise<string[]> {
    const auto: string[] = [];

    // Perfil creado: siempre true si el jugador existe
    auto.push('perfil_creado');

    // Primera predicción: verificar si tiene predicciones
    const predicciones = data.predicciones || 0;
    if (predicciones > 0) {
      auto.push('primera_prediccion');
    }

    // Invita un amigo: verificar si alguien se registró con el código del usuario
    const codigoReferido = data.codigo_referido || uid.substring(0, 8).toUpperCase();
    const referidoSnap = await this.db
      .collection('jugadores')
      .where('referido_por', '==', codigoReferido)
      .limit(1)
      .get();
    if (!referidoSnap.empty) {
      auto.push('invita_amigo');
    }

    // Trivia del mundial: verificar si ya jugó al menos una vez
    const triviasJugadas = data.trivias_jugadas || 0;
    if (triviasJugadas > 0) {
      auto.push('trivia_mundial');
    }

    // 7 días seguidos: verificar campo dias_consecutivos
    const diasConsecutivos = data.dias_consecutivos || 0;
    if (diasConsecutivos >= 7) {
      auto.push('siete_dias');
    }

    return auto;
  }

  private async validarMision(
    uid: string,
    misionId: string,
    data: FirebaseFirestore.DocumentData,
  ): Promise<boolean> {
    switch (misionId) {
      case 'perfil_creado':
        return true;

      case 'primera_prediccion':
        return (data.predicciones || 0) > 0;

      case 'invita_amigo': {
        const codigo = data.codigo_referido || uid.substring(0, 8).toUpperCase();
        const snap = await this.db
          .collection('jugadores')
          .where('referido_por', '==', codigo)
          .limit(1)
          .get();
        return !snap.empty;
      }

      case 'ver_video':
      case 'trivia_mundial':
        // Misión manual: se completa al hacer clic
        return true;

      case 'siete_dias':
        return (data.dias_consecutivos || 0) >= 7;

      default:
        return false;
    }
  }
}
