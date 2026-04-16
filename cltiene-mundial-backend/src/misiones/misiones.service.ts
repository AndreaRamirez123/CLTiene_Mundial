import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Jugador } from '../entities/jugador.entity';
import { Transaccion } from '../entities/transaccion.entity';
import { TriviaHistorial } from '../entities/trivia-historial.entity';
import { calcularNivelActividad } from '../users/nivel-actividad.util';
import { PreguntasService } from '../preguntas/preguntas.service';

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
    titulo: 'Ver video de la marca',
    desc: 'Mira un video de tu empresa',
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
  {
    id: 'runner_mascotas',
    icono: '🐾',
    titulo: 'Runner de Mascotas',
    desc: 'Juega el runner y completa la misión',
    goles: 5,
    tipo: 'manual',
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _LEGACY_PREGUNTAS = [
  [
    {
      pregunta: '¿En qué país se jugará la final del Mundial 2026?',
      opciones: ['México', 'Estados Unidos', 'Canadá', 'Brasil'],
      correcta: 1,
    },
    {
      pregunta: '¿Cuántos equipos participarán en el Mundial 2026?',
      opciones: ['32', '36', '48', '64'],
      correcta: 2,
    },
    {
      pregunta: '¿Quién gana tu prima cada vez que ves fútbol? (Broma CLTiene)',
      opciones: ['Tú con tu Plan Premium', 'Tu rival', 'Nadie', 'Todos'],
      correcta: 0,
    },
    {
      pregunta: '¿Qué debe tener CLTiene para sus clientes?',
      opciones: [
        'Buenas ofertas',
        'Respaldo 24/7',
        'Solo versión basic',
        'Nada especial',
      ],
      correcta: 1,
    },
    {
      pregunta: '¿En qué año se celebró el primer Mundial?',
      opciones: ['1928', '1930', '1934', '1950'],
      correcta: 1,
    },
    {
      pregunta: '¿Cuál es el objetivo de CLTiene en salud?',
      opciones: [
        'Ganar dinero',
        'Orientación médica sin filas',
        'Crear monopolios',
        'Nada',
      ],
      correcta: 1,
    },
  ],
  // Martes
  [
    {
      pregunta: '¿Quién ha ganado más Mundiales?',
      opciones: ['Alemania', 'Argentina', 'Italia', 'Brasil'],
      correcta: 3,
    },
    {
      pregunta: '¿Cuántas fases tiene la Copa Mundial 2026?',
      opciones: ['1', '2', '3', '4'],
      correcta: 2,
    },
    {
      pregunta: '¿Qué servicio ofrece CLTiene para mascotas?',
      opciones: ['Solo gatos', 'Veterinario en casa', 'Nada', 'Safari'],
      correcta: 1,
    },
    {
      pregunta: 'En CLTiene, ¿qué es lo MÁS importante?',
      opciones: ['El lujo', 'Tu bienestar', 'El precio', 'Las ganancias'],
      correcta: 1,
    },
    {
      pregunta: '¿Quién ganó el Mundial 2022?',
      opciones: ['Francia', 'Argentina', 'Brasil', 'Croacia'],
      correcta: 1,
    },
    {
      pregunta:
        '¿Cuántas selecciones sudamericanas históricamente ganan Mundiales?',
      opciones: ['1', '2', '3', '4'],
      correcta: 2,
    },
  ],
  // Miércoles
  [
    {
      pregunta: '¿En qué continente se juega el Mundial 2026?',
      opciones: ['África', 'Europa', 'América', 'Asia'],
      correcta: 2,
    },
    {
      pregunta: '¿Cuál es el Plan de movilidad de CLTiene?',
      opciones: [
        'Para viajes internacionales',
        'Asistencia vehicular 24/7',
        'Solo autobuses',
        'Grúas de juguete',
      ],
      correcta: 1,
    },
    {
      pregunta: '¿Cada cuántos años se juega el Mundial?',
      opciones: ['3 años', '4 años', '3 años', '5 años'],
      correcta: 1,
    },
    {
      pregunta: '¿CLTiene tiene Plan PREMIUM?',
      opciones: ['No existe', 'Sí, cubre todo', 'Solo parcialmente', 'Es mito'],
      correcta: 1,
    },
    {
      pregunta: '¿Cuántos goles anotó Pelé en su carrera?',
      opciones: ['500', '757', '650', '899'],
      correcta: 1,
    },
    {
      pregunta: '¿Qué significa CLTiene?',
      opciones: [
        'Tiene Clientes',
        'Tiene Cobertura',
        'Clientes Tienen',
        'Cuidado Lógico',
      ],
      correcta: 0,
    },
  ],
  // Jueves
  [
    {
      pregunta: '¿Cuál es el equipo con más Mundiales?',
      opciones: ['Alemania', 'Italia', 'Brasil', 'Francia'],
      correcta: 2,
    },
    {
      pregunta: '¿CLTiene cubre qué áreas principales?',
      opciones: [
        'Solo salud',
        'Salud, mascotas, movilidad, hogar',
        'Solo seguros',
        'Nada importante',
      ],
      correcta: 1,
    },
    {
      pregunta: '¿Cuándo fue el último Mundial?',
      opciones: ['2020', '2022', '2024', '2023'],
      correcta: 1,
    },
    {
      pregunta: '¿A través de qué accedes a CLTiene?',
      opciones: [
        'Por correo',
        'Por app y web',
        'Por teléfono fijo',
        'Por telegram',
      ],
      correcta: 1,
    },
    {
      pregunta: '¿Cuántas copas tiene Argentina en su historia?',
      opciones: ['1', '2', '3', '4'],
      correcta: 2,
    },
    {
      pregunta: '¿Cuál es la mentalidad de CLTiene?',
      opciones: [
        'Ganar siempre',
        'Acompañarte en cada momento',
        'Cobrar más',
        'Complicarte',
      ],
      correcta: 1,
    },
  ],
  // Viernes
  [
    {
      pregunta: '¿En qué país juegan la mayoría de partidos del 2026?',
      opciones: ['México', 'Canadá', 'Estados Unidos', 'Igual'],
      correcta: 2,
    },
    {
      pregunta: '¿CLTiene te deja sin estrés?',
      opciones: [
        'A veces',
        'Nunca',
        'Siempre con respaldo 24/7',
        'No promete eso',
      ],
      correcta: 2,
    },
    {
      pregunta: '¿Cuál es tu rol en la polla de CLTiene?',
      opciones: [
        'Apostar dinero',
        'Predecir gratis y ganar goles',
        'Perder tiempo',
        'Ver otros jugar',
      ],
      correcta: 1,
    },
    {
      pregunta: '¿Cómo se llama el asistente médico de CLTiene?',
      opciones: [
        'Dr. Bot',
        'No tiene nombre',
        'Orientación médica experta',
        'ChatGPT',
      ],
      correcta: 2,
    },
    {
      pregunta: '¿Qué jugador ganó el Balón de Oro 2023?',
      opciones: ['Mbappé', 'Haaland', 'Messi', 'Rodri'],
      correcta: 3,
    },
    {
      pregunta: '¿Para qué sirve CLTiene premium?',
      opciones: [
        'Nada',
        'Cobertura integral de salud, hogar, mascotas',
        'Solo marketing',
        'Es lo mismo',
      ],
      correcta: 1,
    },
  ],
  // Sábado
  [
    {
      pregunta: '¿Cuál es la capital futbolística del 2026?',
      opciones: ['Toronto', 'Ciudad de México', 'Nueva York', 'Los Ángeles'],
      correcta: 2,
    },
    {
      pregunta: '¿CLTiene tiene atención 24/7?',
      opciones: [
        'Solo en horario laboral',
        'Sí, siempre respaldándote',
        'Fines de semana no',
        'Solo telefonía',
      ],
      correcta: 1,
    },
    {
      pregunta: '¿Qué recibes en CLTiene para tu mascota?',
      opciones: [
        'Solo alimento',
        'Veterinario en casa y cuidado integral',
        'Nada',
        'Solo consultas',
      ],
      correcta: 1,
    },
    {
      pregunta: '¿Cuántos goles acumulas en la polla?',
      opciones: [
        'Depende',
        'Los que ganes prediciendo',
        'Ninguno',
        'Todos iguales',
      ],
      correcta: 1,
    },
    {
      pregunta: '¿Qué equipo ganó la Euro 2024?',
      opciones: ['Italia', 'España', 'Francia', 'Alemania'],
      correcta: 2,
    },
    {
      pregunta: '¿Cuál es el valor de CLTiene?',
      opciones: [
        'Maximizar ganancias',
        'Estar contigo en cada momento',
        'Cobrar más caro',
        'Competir',
      ],
      correcta: 1,
    },
  ],
  // Domingo
  [
    {
      pregunta: '¿Cuántas ciudades sedes hay en el 2026?',
      opciones: ['8', '12', '16', '20'],
      correcta: 2,
    },
    {
      pregunta: '¿Cómo es el trato de CLTiene?',
      opciones: [
        'Corporativo y frío',
        'Cercano y solidario',
        'Solo online',
        'Complicado',
      ],
      correcta: 1,
    },
    {
      pregunta: '¿Qué es lo que CLTiene NO hace?',
      opciones: [
        'Acompañar',
        'Te deja sin protección',
        'Respaldarte',
        'Cuidarte',
      ],
      correcta: 1,
    },
    {
      pregunta: '¿A quién contactas en CLTiene ante emergencia?',
      opciones: [
        'Esperanzas',
        'Atención 24/7 inmediata',
        'Nadie',
        'Tu familia',
      ],
      correcta: 1,
    },
    {
      pregunta: '¿Cuál fue la sorpresa del Mundial 2022?',
      opciones: [
        'Brasil ganó',
        'Argentina campeón',
        'Marruecos en semifinal',
        'Francia perfecta',
      ],
      correcta: 2,
    },
    {
      pregunta: '¿Qué promete CLTiene?',
      opciones: [
        'Las mejores ganancias',
        'Calidad de vida con cobertura integral',
        'Solo dinero',
        'Lujos',
      ],
      correcta: 1,
    },
  ],
];

const fechaColombia = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

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
    private readonly preguntasService: PreguntasService,
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

      const hoy1 = fechaColombia();
      const lista = MISIONES.map((m) => {
        if (m.id === 'runner_mascotas') return { ...m, ok: jugador.ultimo_runner === hoy1 };
        return { ...m, ok: todasCompletadasArr.includes(m.id) };
      });
      const totalCompletadas = lista.filter((m) => m.ok).length;

      return {
        misiones: lista,
        completadas: totalCompletadas,
        total: lista.length,
        goles_otorgados: golesGanados,
        trivia_disponible: jugador.ultimo_trivia !== hoy1,
        runner_disponible: jugador.ultimo_runner !== hoy1,
      };
    }

    // Combinar completadas manuales + auto-detectadas
    const todasCompletadas = [...new Set([...completadas, ...autoCompletadas])];

    const lista = MISIONES.map((m) => ({
      ...m,
      ok: todasCompletadas.includes(m.id),
    }));

    const totalCompletadas = lista.filter((m) => m.ok).length;
    const hoy2 = fechaColombia();

    const misionesConRunner = lista.map((m) => {
      if (m.id === 'runner_mascotas') {
        return { ...m, ok: jugador.ultimo_runner === hoy2 };
      }
      return m;
    });

    const totalCompletadasConRunner = misionesConRunner.filter((m) => m.ok).length;

    return {
      misiones: misionesConRunner,
      completadas: totalCompletadasConRunner,
      total: misionesConRunner.length,
      trivia_disponible: jugador.ultimo_trivia !== hoy2,
      runner_disponible: jugador.ultimo_runner !== hoy2,
    };
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
    jugador.nivel = calcularNivelActividad(jugador);
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
      jug.nivel = calcularNivelActividad(jug);
      await manager.save(Jugador, jug);

      // Guardar en trivias_historial
      await manager.save(TriviaHistorial, {
        jugador_id: jug.id,
        correctas,
        total_preguntas: 6,
        goles_ganados: golesFinales,
        primera_vez: esPrimeraVez ? 1 : 0,
        fecha: hoy,
      });
    });

    if (esPrimeraVez) {
      const mision = MISIONES.find((m) => m.id === 'trivia_mundial')!;
      const golesConMision = golesGanados + mision.goles;
      return {
        mensaje: `¡Trivia completada! +${golesConMision} goles (${correctas}/6 correctas + bono primera vez)`,
        goles_ganados: golesConMision,
        correctas,
        primera_vez: true,
      };
    }

    return {
      mensaje: `¡Trivia completada! +${golesGanados} goles (${correctas}/6 correctas)`,
      goles_ganados: golesGanados,
      correctas,
      primera_vez: false,
    };
  }

  async jugarRunner(uid: string) {
    const hoy = fechaColombia();
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) throw new BadRequestException('Jugador no encontrado');

    if (jugador.ultimo_runner === hoy) {
      return {
        mensaje: '¡Ya jugaste el runner hoy! Vuelve mañana para ganar más goles.',
        goles_ganados: 0,
        ya_jugado: true,
      };
    }

    const mision = MISIONES.find((m) => m.id === 'runner_mascotas')!;
    jugador.goles = (jugador.goles || 0) + mision.goles;
    jugador.ultimo_runner = hoy;
    jugador.ultimo_acceso = new Date();
    jugador.nivel = calcularNivelActividad(jugador);
    await this.jugadorRepo.save(jugador);

    return {
      mensaje: `¡Runner completado! +${mision.goles} goles`,
      goles_ganados: mision.goles,
      ya_jugado: false,
    };
  }

  // Obtener preguntas desde la DB para una empresa
  async getPreguntasDelDia(empresaId: number) {
    const preguntas = await this.preguntasService.getPreguntasPorEmpresa(empresaId, 6);
    const hoy = new Date().getDay();

    return {
      preguntas,
      fecha: new Date().toISOString().split('T')[0],
      dia: [
        'Domingo',
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
      ][hoy],
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
      case 'runner_mascotas':
        // Misión manual: se completa al hacer clic
        return true;

      case 'siete_dias':
        return (jugador.dias_consecutivos || 0) >= 7;

      default:
        return false;
    }
  }
}
