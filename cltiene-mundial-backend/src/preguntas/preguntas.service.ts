import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Pregunta } from '../entities/pregunta.entity';
import { Empresa } from '../entities/empresa.entity';

@Injectable()
export class PreguntasService implements OnModuleInit {
  private readonly logger = new Logger(PreguntasService.name);

  constructor(
    @InjectRepository(Pregunta)
    private preguntaRepo: Repository<Pregunta>,
    @InjectRepository(Empresa)
    private empresaRepo: Repository<Empresa>,
    private configService: ConfigService,
  ) {}

  // Al iniciar, migrar BANCO_PREGUNTAS si la tabla esta vacia
  async onModuleInit() {
    const count = await this.preguntaRepo.count();
    if (count === 0) {
      this.logger.log('Migrando BANCO_PREGUNTAS a la base de datos...');
      await this.seedPreguntasGlobales();
    }
  }

  // Obtener preguntas para una empresa (globales + de la empresa)
  async getPreguntasPorEmpresa(empresaId: number, limite = 6) {
    const preguntas = await this.preguntaRepo.find({
      where: [
        { empresa_id: IsNull(), activa: 1 },
        { empresa_id: empresaId, activa: 1 },
      ],
      order: { created_at: 'DESC' },
    });

    // Mezclar y tomar el limite
    const mezcladas = this.mezclar(preguntas);
    return mezcladas.slice(0, limite).map((p) => ({
      id: p.id,
      pregunta: p.pregunta,
      opciones: p.opciones,
      correcta: p.correcta,
      tipo: p.tipo,
    }));
  }

  // CRUD: Listar preguntas (admin)
  async listar(empresaId?: number) {
    const where = empresaId
      ? [{ empresa_id: empresaId }, { empresa_id: IsNull() }]
      : {};
    return this.preguntaRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  // CRUD: Crear pregunta manual
  async crear(datos: {
    pregunta: string;
    opciones: string[];
    correcta: number;
    empresa_id?: number;
    tipo?: string;
  }) {
    if (!datos.opciones || datos.opciones.length !== 4) {
      throw new BadRequestException('Debe tener exactamente 4 opciones.');
    }
    if (datos.correcta < 0 || datos.correcta > 3) {
      throw new BadRequestException(
        'El indice de respuesta correcta debe ser 0-3.',
      );
    }

    const pregunta = this.preguntaRepo.create({
      pregunta: datos.pregunta,
      opciones: datos.opciones,
      correcta: datos.correcta,
      empresa_id: datos.empresa_id || null,
      tipo: datos.tipo || 'mundial',
      activa: 1,
    });
    return this.preguntaRepo.save(pregunta);
  }

  // CRUD: Eliminar
  async eliminar(id: number) {
    return this.preguntaRepo.delete(id);
  }

  // CRUD: Toggle activa/inactiva
  async toggleActiva(id: number) {
    const pregunta = await this.preguntaRepo.findOne({ where: { id } });
    if (!pregunta) throw new BadRequestException('Pregunta no encontrada.');
    pregunta.activa = pregunta.activa === 1 ? 0 : 1;
    return this.preguntaRepo.save(pregunta);
  }

  // Generar preguntas con Gemini
  async generarConIA(empresaId: number) {
    const empresa = await this.empresaRepo.findOne({
      where: { id: empresaId },
    });
    if (!empresa) throw new BadRequestException('Empresa no encontrada.');

    const apiKey = this.configService.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('GEMINI_API_KEY no configurada en el .env');
    }

    const prompt = `Genera exactamente 6 preguntas de trivia en formato JSON.

3 preguntas sobre el Mundial de Futbol FIFA 2026 (sedes: USA, Mexico, Canada).
3 preguntas sobre la empresa "${empresa.nombre}" (inventa datos coherentes si no los conoces: servicios, valores, beneficios).

Cada pregunta debe tener este formato exacto:
{
  "pregunta": "texto de la pregunta",
  "opciones": ["opcion1", "opcion2", "opcion3", "opcion4"],
  "correcta": 0,
  "tipo": "mundial" o "empresa"
}

"correcta" es el indice (0-3) de la opcion correcta.

Responde SOLO con un array JSON, sin texto adicional ni markdown. Ejemplo:
[{"pregunta":"...","opciones":["a","b","c","d"],"correcta":0,"tipo":"mundial"}]`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      );

      const data = await response.json();
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Extraer JSON del texto (puede venir envuelto en ```json ... ```)
      const jsonMatch = texto.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
      }

      const preguntas = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(preguntas) || preguntas.length === 0) {
        throw new Error('Gemini no devolvio preguntas validas');
      }

      // Guardar en DB evitando duplicados
      let guardadas = 0;
      for (const p of preguntas) {
        if (
          !p.pregunta ||
          !p.opciones ||
          p.opciones.length !== 4 ||
          p.correcta == null
        ) {
          continue;
        }

        // Verificar duplicado
        const existe = await this.preguntaRepo.findOne({
          where: { pregunta: p.pregunta, empresa_id: empresaId },
        });
        if (existe) continue;

        await this.preguntaRepo.save(
          this.preguntaRepo.create({
            pregunta: p.pregunta,
            opciones: p.opciones,
            correcta: p.correcta,
            empresa_id: empresaId,
            tipo: p.tipo || 'mundial',
            activa: 1,
          }),
        );
        guardadas++;
      }

      return {
        mensaje: `${guardadas} preguntas generadas y guardadas para ${empresa.nombre}`,
        total_generadas: preguntas.length,
        guardadas,
      };
    } catch (error) {
      this.logger.error('Error generando preguntas con Gemini', error);
      throw new BadRequestException(
        `Error generando preguntas: ${error.message}`,
      );
    }
  }

  // Seed: migrar BANCO_PREGUNTAS estatico a la DB como preguntas globales
  private async seedPreguntasGlobales() {
    const BANCO = [
      // Preguntas del Mundial (globales)
      {
        pregunta: 'En que pais se jugara la final del Mundial 2026?',
        opciones: ['Mexico', 'Estados Unidos', 'Canada', 'Brasil'],
        correcta: 1,
        tipo: 'mundial',
      },
      {
        pregunta: 'Cuantos equipos participaran en el Mundial 2026?',
        opciones: ['32', '36', '48', '64'],
        correcta: 2,
        tipo: 'mundial',
      },
      {
        pregunta: 'Cual seleccion ha ganado mas Mundiales?',
        opciones: ['Alemania', 'Argentina', 'Brasil', 'Italia'],
        correcta: 2,
        tipo: 'mundial',
      },
      {
        pregunta: 'En que ano se jugo el primer Mundial?',
        opciones: ['1928', '1930', '1934', '1942'],
        correcta: 1,
        tipo: 'mundial',
      },
      {
        pregunta: 'Cual fue la sede del Mundial 2022?',
        opciones: ['Rusia', 'Qatar', 'Japon', 'Sudafrica'],
        correcta: 1,
        tipo: 'mundial',
      },
      {
        pregunta: 'Quien gano el Balon de Oro del Mundial 2022?',
        opciones: ['Mbappe', 'Messi', 'Modric', 'Neymar'],
        correcta: 1,
        tipo: 'mundial',
      },
      {
        pregunta: 'Cuantos goles marco Kylian Mbappe en la final 2022?',
        opciones: ['1', '2', '3', '4'],
        correcta: 2,
        tipo: 'mundial',
      },
      {
        pregunta: 'Que pais ha sido sede del Mundial en mas ocasiones?',
        opciones: ['Mexico', 'Brasil', 'Italia', 'Alemania'],
        correcta: 0,
        tipo: 'mundial',
      },
      {
        pregunta:
          'Cuantos partidos se jugaran en fase de grupos del Mundial 2026?',
        opciones: ['48', '64', '72', '96'],
        correcta: 2,
        tipo: 'mundial',
      },
      {
        pregunta: 'Que estadio albergara la final del Mundial 2026?',
        opciones: ['Azteca', 'MetLife Stadium', 'Rose Bowl', 'AT&T Stadium'],
        correcta: 1,
        tipo: 'mundial',
      },
      {
        pregunta:
          'Cual seleccion suramericana clasifico invicta al Mundial 2026?',
        opciones: ['Brasil', 'Argentina', 'Uruguay', 'Colombia'],
        correcta: 1,
        tipo: 'mundial',
      },
      {
        pregunta: 'Cuantos grupos tendra el Mundial 2026?',
        opciones: ['8', '10', '12', '16'],
        correcta: 2,
        tipo: 'mundial',
      },
      {
        pregunta: 'Que pais centroamericano clasifico al Mundial 2026?',
        opciones: ['Costa Rica', 'Honduras', 'Panama', 'Guatemala'],
        correcta: 2,
        tipo: 'mundial',
      },
      {
        pregunta: 'Quien es el maximo goleador historico de los Mundiales?',
        opciones: ['Ronaldo', 'Klose', 'Pele', 'Messi'],
        correcta: 1,
        tipo: 'mundial',
      },
    ];

    const entities = BANCO.map((p) =>
      this.preguntaRepo.create({
        ...p,
        empresa_id: null,
        activa: 1,
      }),
    );
    await this.preguntaRepo.save(entities);
    this.logger.log(`${entities.length} preguntas globales migradas a la DB`);
  }

  private mezclar<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
