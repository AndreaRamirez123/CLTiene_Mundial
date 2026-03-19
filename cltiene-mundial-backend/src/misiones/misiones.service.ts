import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Jugador } from '../entities/jugador.entity';
import { Transaccion } from '../entities/transaccion.entity';
import { TriviaHistorial } from '../entities/trivia-historial.entity';

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
  constructor(
    @InjectRepository(Jugador)
    private readonly jugadorRepo: Repository<Jugador>,
    @InjectRepository(Transaccion)
    private readonly transaccionRepo: Repository<Transaccion>,
    @InjectRepository(TriviaHistorial)
    private readonly triviaRepo: Repository<TriviaHistorial>,
    private readonly dataSource: DataSource,
  ) {}

  async getMisiones(uid: string) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) {
      throw new BadRequestException('Jugador no encontrado');
    }

    const completadas: string[] = jugador.misiones_completadas || [];

    // Auto-detectar misiones completables
    const autoCompletadas = await this.detectarAutoCompletadas(jugador);

    // Encontrar misiones auto-detectadas que aún no fueron registradas
    const nuevas = autoCompletadas.filter((id) => !completadas.includes(id));

    // Si hay nuevas misiones auto-completadas, otorgar goles y registrarlas
    if (nuevas.length > 0) {
      const golesGanados = nuevas.reduce((sum, id) => {
        const mision = MISIONES.find((m) => m.id === id);
        return sum + (mision?.goles || 0);
      }, 0);

      const todasCompletadasArr = [...completadas, ...nuevas];

      jugador.misiones_completadas = todasCompletadasArr;
      jugador.goles = (jugador.goles || 0) + golesGanados;
      await this.jugadorRepo.save(jugador);

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

    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) {
      throw new BadRequestException('Jugador no encontrado');
    }

    const completadas: string[] = jugador.misiones_completadas || [];

    if (completadas.includes(misionId)) {
      throw new BadRequestException('Ya completaste esta misión');
    }

    // Validar que la misión se puede completar
    const puedeCompletar = await this.validarMision(jugador, misionId);
    if (!puedeCompletar) {
      throw new BadRequestException(
        'Aún no cumples los requisitos para completar esta misión',
      );
    }

    // Otorgar goles y registrar misión completada
    const golesActuales = jugador.goles || 0;

    jugador.misiones_completadas = [...completadas, misionId];
    jugador.goles = golesActuales + mision.goles;
    jugador.ultimo_acceso = new Date();
    await this.jugadorRepo.save(jugador);

    return {
      mensaje: `¡Misión "${mision.titulo}" completada! +${mision.goles} goles`,
      goles_ganados: mision.goles,
      goles_total: golesActuales + mision.goles,
    };
  }

  async jugarTrivia(uid: string, correctas: number) {
    const hoy = new Date().toISOString().split('T')[0];
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });

    if (!jugador) {
      throw new BadRequestException('Jugador no encontrado');
    }

    // Verificar si ya jugó hoy
    if (jugador.ultimo_trivia === hoy) {
      throw new BadRequestException(
        'Ya jugaste la trivia hoy. ¡Vuelve mañana para ganar más goles!',
      );
    }

    const golesGanados = Math.max(1, correctas);
    const golesActuales = jugador.goles || 0;
    const totalTrivias = (jugador.trivias_jugadas || 0) + 1;

    // Completar la misión en la primera vez
    const completadas: string[] = jugador.misiones_completadas || [];
    const esPrimeraVez = !completadas.includes('trivia_mundial');

    await this.dataSource.transaction(async (manager) => {
      const jug = await manager.findOne(Jugador, { where: { uid } });
      if (!jug) return;

      let golesFinales = golesGanados;

      if (esPrimeraVez) {
        const mision = MISIONES.find((m) => m.id === 'trivia_mundial')!;
        golesFinales = golesGanados + mision.goles;
        jug.misiones_completadas = [...completadas, 'trivia_mundial'];
      }

      jug.goles = golesActuales + golesFinales;
      jug.ultimo_trivia = hoy;
      jug.trivias_jugadas = totalTrivias;
      jug.ultimo_acceso = new Date();
      await manager.save(Jugador, jug);

      // Guardar en trivias_historial
      await manager.save(TriviaHistorial, {
        jugador_id: jug.id,
        correctas,
        total_preguntas: 5,
        goles_ganados: golesFinales,
        primera_vez: esPrimeraVez ? 1 : 0,
        fecha: hoy,
      });
    });

    if (esPrimeraVez) {
      const mision = MISIONES.find((m) => m.id === 'trivia_mundial')!;
      const golesConMision = golesGanados + mision.goles;
      return {
        mensaje: `¡Trivia completada! +${golesConMision} goles (${correctas}/5 correctas + bono primera vez)`,
        goles_ganados: golesConMision,
        correctas,
        primera_vez: true,
      };
    }

    return {
      mensaje: `¡Trivia completada! +${golesGanados} goles (${correctas}/5 correctas)`,
      goles_ganados: golesGanados,
      correctas,
      primera_vez: false,
    };
  }

  private async detectarAutoCompletadas(jugador: Jugador): Promise<string[]> {
    const auto: string[] = [];

    // Perfil creado: siempre true si el jugador existe
    auto.push('perfil_creado');

    // Primera predicción: verificar si tiene predicciones
    if ((jugador.predicciones_count || 0) > 0) {
      auto.push('primera_prediccion');
    }

    // Invita un amigo: verificar si alguien se registró con el código del usuario
    const codigoReferido = jugador.codigo_referido;
    if (codigoReferido) {
      const referido = await this.jugadorRepo.findOne({
        where: { referido_por: codigoReferido },
      });
      if (referido) {
        auto.push('invita_amigo');
      }
    }

    // Trivia del mundial: verificar si ya jugó al menos una vez
    if ((jugador.trivias_jugadas || 0) > 0) {
      auto.push('trivia_mundial');
    }

    // 7 días seguidos: verificar campo dias_consecutivos
    if ((jugador.dias_consecutivos || 0) >= 7) {
      auto.push('siete_dias');
    }

    return auto;
  }

  private async validarMision(
    jugador: Jugador,
    misionId: string,
  ): Promise<boolean> {
    switch (misionId) {
      case 'perfil_creado':
        return true;

      case 'primera_prediccion':
        return (jugador.predicciones_count || 0) > 0;

      case 'invita_amigo': {
        const codigo = jugador.codigo_referido;
        if (!codigo) return false;
        const referido = await this.jugadorRepo.findOne({
          where: { referido_por: codigo },
        });
        return !!referido;
      }

      case 'ver_video':
      case 'trivia_mundial':
        // Misión manual: se completa al hacer clic
        return true;

      case 'siete_dias':
        return (jugador.dias_consecutivos || 0) >= 7;

      default:
        return false;
    }
  }
}
