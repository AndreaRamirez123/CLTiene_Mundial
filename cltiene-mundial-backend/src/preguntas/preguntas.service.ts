import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, Brackets } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Pregunta } from '../entities/pregunta.entity';
import { Empresa } from '../entities/empresa.entity';
import { TriviaDiaria } from '../entities/trivia-diaria.entity';
import { fechaColombiaISO } from '../users/nivel-actividad.util';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PreguntasService implements OnModuleInit {
  private readonly logger = new Logger(PreguntasService.name);
  private readonly preguntasMundialPorDia = 3;
  private readonly preguntasEmpresaPorDia = 3;

  constructor(
    @InjectRepository(Pregunta)
    private preguntaRepo: Repository<Pregunta>,
    @InjectRepository(Empresa)
    private empresaRepo: Repository<Empresa>,
    @InjectRepository(TriviaDiaria)
    private triviaDiariaRepo: Repository<TriviaDiaria>,
    private configService: ConfigService,
  ) {}

  // Al iniciar, migrar BANCO_PREGUNTAS si la tabla está vacía
  async onModuleInit() {
    const count = await this.preguntaRepo.count();
    if (count === 0) {
      this.logger.log('Migrando BANCO_PREGUNTAS a la base de datos...');
      await this.seedPreguntasGlobales();
    }
    await this.corregirPreguntasGlobalesLegadas();
  }

  // Generar preguntas IA diarias por empresa (opcional)
  @Cron('5 0 * * *')
  async generarDiarias() {
    const enabled =
      (this.configService.get<string>('OPENAI_TRIVIA_DAILY') || 'false')
        .toLowerCase() === 'true';
    if (!enabled) return;

    const empresas = await this.empresaRepo.find({
      where: { estado: 'activa' },
    });

    for (const empresa of empresas) {
      const disponibles = await this.contarPoolMundial(empresa.id);
      if (disponibles >= 30) continue;

      try {
        await this.generarConIA(empresa.id, 12);
      } catch (error) {
        this.logger.error(
          `Error reforzando banco mundial para empresa ${empresa.id}`,
          error,
        );
      }
    }
  }

  // Obtener la trivia diaria: 3 preguntas del Mundial + 3 de la empresa.
  async getPreguntasPorEmpresa(empresaId: number, limite = 6) {
    const fecha = fechaColombiaISO();
    let trivia = await this.triviaDiariaRepo.findOne({
      where: { empresa_id: empresaId, fecha },
    });

    if (!trivia) {
      const preguntaIds = await this.seleccionarPreguntasDelDia(
        empresaId,
        limite,
        fecha,
      );

      try {
        trivia = await this.triviaDiariaRepo.save(
          this.triviaDiariaRepo.create({
            empresa_id: empresaId,
            fecha,
            pregunta_ids: preguntaIds,
          }),
        );
      } catch {
        trivia = await this.triviaDiariaRepo.findOne({
          where: { empresa_id: empresaId, fecha },
        });
      }
    }

    let preguntaIds = this.normalizarPreguntaIds(trivia?.pregunta_ids);

    if (trivia && preguntaIds.length === 0) {
      preguntaIds = await this.seleccionarPreguntasDelDia(
        empresaId,
        limite,
        fecha,
      );
      trivia.pregunta_ids = preguntaIds;
      await this.triviaDiariaRepo.save(trivia);
    }

    let preguntas = await this.cargarPreguntasPorIds(
      preguntaIds.slice(0, limite),
    );

    if (trivia && preguntas.length < Math.min(limite, preguntaIds.length)) {
      preguntaIds = await this.seleccionarPreguntasDelDia(
        empresaId,
        limite,
        fecha,
      );
      trivia.pregunta_ids = preguntaIds;
      await this.triviaDiariaRepo.save(trivia);
      preguntas = await this.cargarPreguntasPorIds(
        preguntaIds.slice(0, limite),
      );
    }

    return preguntas.map((p) => ({
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
      order: { created_at: 'ASC' },
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
    const tipo = datos.tipo === 'empresa' ? 'empresa' : 'mundial';
    const empresaId = datos.empresa_id || null;

    if (!datos.opciones || datos.opciones.length === 0 || datos.opciones.some((op) => !op)) {
      throw new BadRequestException('Debe tener opciones válidas.');
    }

    if (datos.opciones.length === 2) {
      const normales = datos.opciones.map((op) => String(op).trim().toLowerCase());
      const esVF = normales.includes('verdadero') && normales.includes('falso');
      if (!esVF) {
        throw new BadRequestException('Las preguntas de 2 opciones deben ser Verdadero/Falso.');
      }
    } else if (datos.opciones.length !== 4) {
      throw new BadRequestException('Debe tener exactamente 4 opciones.');
    }

    if (datos.correcta < 0 || datos.correcta >= datos.opciones.length) {
      throw new BadRequestException(
        'El índice de respuesta correcta debe ser válido.',
      );
    }
    if (tipo === 'empresa' && !empresaId) {
      throw new BadRequestException(
        'Las preguntas de empresa deben estar asociadas a una empresa.',
      );
    }

    const pregunta = this.preguntaRepo.create({
      pregunta: datos.pregunta.trim(),
      opciones: datos.opciones,
      correcta: datos.correcta,
      empresa_id: empresaId,
      tipo,
      activa: 1,
    });
    return this.preguntaRepo.save(pregunta);
  }

  async crearVarias(
    preguntas: {
      pregunta: string;
      opciones: string[];
      correcta: number;
      empresa_id?: number;
      tipo?: string;
    }[],
  ) {
    if (!Array.isArray(preguntas) || preguntas.length === 0) {
      throw new BadRequestException('No hay preguntas para guardar.');
    }

    let guardadas = 0;
    const errores: { indice: number; mensaje: string }[] = [];

    for (const [index, pregunta] of preguntas.entries()) {
      try {
        await this.crear(pregunta);
        guardadas++;
      } catch (error) {
        errores.push({
          indice: index + 1,
          mensaje:
            error instanceof Error ? error.message : 'Pregunta inválida.',
        });
      }
    }

    return {
      mensaje: `${guardadas} preguntas guardadas`,
      guardadas,
      errores,
    };
  }

  // CRUD: Eliminar
  async eliminar(id: number, empresaId?: number) {
    await this.validarEdicionPregunta(id, empresaId);
    return this.preguntaRepo.delete(id);
  }

  // CRUD: Toggle activa/inactiva
  async toggleActiva(id: number, empresaId?: number) {
    const pregunta = await this.validarEdicionPregunta(id, empresaId);
    pregunta.activa = pregunta.activa === 1 ? 0 : 1;
    return this.preguntaRepo.save(pregunta);
  }

  // Generar preguntas con OpenAI
  async generarConIA(empresaId: number, cantidad = 12) {
    const empresa = await this.empresaRepo.findOne({
      where: { id: empresaId },
    });
    if (!empresa) throw new BadRequestException('Empresa no encontrada.');

    const apiKey = this.configService.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('OPENAI_API_KEY no configurada en el .env');
    }
    const model =
      this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';

    const limite = Math.min(Math.max(Number(cantidad) || 12, 3), 30);
    const existentes = await this.obtenerPreguntasMundialExistentes(empresaId);
    const listaExistentes = existentes
      .slice(0, 80)
      .map((p) => `- ${p.pregunta}`)
      .join('\n');

    const prompt = `Genera exactamente ${limite} preguntas nuevas de trivia en formato JSON.

Tema único: Mundial de Fútbol FIFA 2026, historia de los mundiales, sedes, formato, selecciones, récords y curiosidades futboleras.

No generes preguntas sobre la empresa "${empresa.nombre}".
No inventes servicios, beneficios ni datos corporativos.
Evita repetir estas preguntas ya existentes:
${listaExistentes || '- No hay preguntas previas.'}

Cada pregunta debe tener este formato exacto:
{
  "pregunta": "texto de la pregunta",
  "opciones": ["opción1", "opción2", "opción3", "opción4"],
  "correcta": 0,
  "tipo": "mundial"
}

"correcta" es el índice (0-3) de la opción correcta.

Responde SOLO con un array JSON, sin texto adicional ni markdown. Ejemplo:
[{"pregunta":"...","opciones":["a","b","c","d"],"correcta":0,"tipo":"mundial"}]`;

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: prompt,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        this.logger.warn(`OpenAI trivia error ${response.status}: ${err}`);
        if (response.status === 401) {
          throw new Error(
            'OPENAI_API_KEY inválida o revocada. Crea una key nueva y reinicia el backend.',
          );
        }
        if (response.status === 429) {
          throw new Error(
            'OpenAI no tiene cuota disponible o alcanzó el límite de uso.',
          );
        }
        throw new Error(`OpenAI respondió con estado ${response.status}.`);
      }

      const data = await response.json();
      const texto = this.extraerTextoRespuesta(data?.output || '');

      // Extraer JSON del texto (puede venir envuelto en ```json ... ```)
      const jsonMatch = texto.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta de OpenAI');
      }

      const preguntas = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(preguntas) || preguntas.length === 0) {
        throw new Error('OpenAI no devolvió preguntas válidas');
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
        const existe = await this.preguntaRepo
          .createQueryBuilder('pregunta')
          .where('pregunta.pregunta = :texto', { texto: p.pregunta })
          .andWhere('pregunta.tipo = :tipo', { tipo: 'mundial' })
          .andWhere(
            new Brackets((qb) => {
              qb.where('pregunta.empresa_id IS NULL').orWhere(
                'pregunta.empresa_id = :empresaId',
                { empresaId },
              );
            }),
          )
          .getOne();
        if (existe) continue;

        await this.preguntaRepo.save(
          this.preguntaRepo.create({
            pregunta: String(p.pregunta).trim(),
            opciones: p.opciones,
            correcta: p.correcta,
            empresa_id: empresaId,
            tipo: 'mundial',
            activa: 1,
          }),
        );
        guardadas++;
      }

      return {
        mensaje: `${guardadas} preguntas del Mundial generadas para ${empresa.nombre}`,
        total_generadas: preguntas.length,
        guardadas,
      };
    } catch (error) {
      this.logger.error('Error generando preguntas con OpenAI', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error generando preguntas con IA.',
      );
    }
  }

  private extraerTextoRespuesta(output: any): string {
    if (!Array.isArray(output)) return '';
    for (const item of output) {
      if (item?.type === 'message' && Array.isArray(item.content)) {
        const chunk = item.content.find((c: any) => c.type === 'output_text');
        if (chunk?.text) return String(chunk.text);
      }
    }
    return '';
  }

  private async seleccionarPreguntasDelDia(
    empresaId: number,
    limite: number,
    fecha: string,
  ) {
    const objetivoMundial = Math.min(this.preguntasMundialPorDia, limite);
    const objetivoEmpresa = Math.min(
      this.preguntasEmpresaPorDia,
      Math.max(limite - objetivoMundial, 0),
    );

    const mundial = await this.seleccionarPool(
      empresaId,
      'mundial',
      objetivoMundial,
    );
    const empresa = await this.seleccionarPool(
      empresaId,
      'empresa',
      objetivoEmpresa,
      mundial.map((p) => p.id),
    );

    const seleccionadas = [...mundial, ...empresa];

    if (seleccionadas.length < limite) {
      const fallback = await this.seleccionarPool(
        empresaId,
        null,
        limite - seleccionadas.length,
        seleccionadas.map((p) => p.id),
      );
      seleccionadas.push(...fallback);
    }

    const ids = seleccionadas.slice(0, limite).map((p) => p.id);
    await this.marcarPreguntasUsadas(ids, fecha);
    return ids;
  }

  private async seleccionarPool(
    empresaId: number,
    tipo: 'mundial' | 'empresa' | null,
    cantidad: number,
    excluirIds: number[] = [],
  ) {
    if (cantidad <= 0) return [];

    const qb = this.preguntaRepo
      .createQueryBuilder('p')
      .where('p.activa = :activa', { activa: 1 });

    if (tipo) {
      qb.andWhere('p.tipo = :tipo', { tipo });
    }

    if (tipo === 'empresa') {
      qb.andWhere('p.empresa_id = :empresaId', { empresaId });
    } else {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('p.empresa_id IS NULL')
            .orWhere('p.empresa_id = :empresaId', { empresaId });
        }),
      );
    }

    if (excluirIds.length > 0) {
      qb.andWhere('p.id NOT IN (:...excluirIds)', { excluirIds });
    }

    return qb
      .orderBy('CASE WHEN p.ultima_usada IS NULL THEN 0 ELSE 1 END', 'ASC')
      .addOrderBy('p.ultima_usada', 'ASC')
      .addOrderBy('p.veces_usada', 'ASC')
      .addOrderBy('RAND()')
      .limit(cantidad)
      .getMany();
  }

  private async marcarPreguntasUsadas(ids: number[], fecha: string) {
    if (ids.length === 0) return;

    await this.preguntaRepo
      .createQueryBuilder()
      .update(Pregunta)
      .set({
        ultima_usada: fecha,
        veces_usada: () => 'veces_usada + 1',
      })
      .where('id IN (:...ids)', { ids })
      .execute();
  }

  private async cargarPreguntasPorIds(ids: number[]) {
    if (ids.length === 0) return [];
    const preguntas = await this.preguntaRepo.find({
      where: { id: In(ids) },
    });
    const porId = new Map(preguntas.map((p) => [p.id, p]));
    return ids.map((id) => porId.get(id)).filter(Boolean) as Pregunta[];
  }

  private normalizarPreguntaIds(valor: unknown): number[] {
    if (!valor) return [];

    let ids = valor;
    if (typeof valor === 'string') {
      try {
        ids = JSON.parse(valor);
      } catch {
        ids = valor.split(',');
      }
    }

    if (!Array.isArray(ids)) return [];

    return ids
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  private async contarPoolMundial(empresaId: number) {
    return this.preguntaRepo
      .createQueryBuilder('p')
      .where('p.activa = :activa', { activa: 1 })
      .andWhere('p.tipo = :tipo', { tipo: 'mundial' })
      .andWhere(
        new Brackets((qb) => {
          qb.where('p.empresa_id IS NULL').orWhere(
            'p.empresa_id = :empresaId',
            { empresaId },
          );
        }),
      )
      .getCount();
  }

  private async obtenerPreguntasMundialExistentes(empresaId: number) {
    return this.preguntaRepo
      .createQueryBuilder('p')
      .where('p.tipo = :tipo', { tipo: 'mundial' })
      .andWhere(
        new Brackets((qb) => {
          qb.where('p.empresa_id IS NULL').orWhere(
            'p.empresa_id = :empresaId',
            { empresaId },
          );
        }),
      )
      .orderBy('p.created_at', 'DESC')
      .limit(120)
      .getMany();
  }

  private async validarEdicionPregunta(id: number, empresaId?: number) {
    const pregunta = await this.preguntaRepo.findOne({ where: { id } });
    if (!pregunta) throw new BadRequestException('Pregunta no encontrada.');

    if (empresaId && pregunta.empresa_id !== empresaId) {
      throw new BadRequestException(
        'No tienes permiso para modificar esta pregunta.',
      );
    }

    return pregunta;
  }

  // Seed: migrar BANCO_PREGUNTAS estático a la DB como preguntas globales
  private async seedPreguntasGlobales() {
    const BANCO = [
      // Preguntas del Mundial (globales)
      {
        pregunta: '¿En qué país se jugará la final del Mundial 2026?',
        opciones: ['México', 'Estados Unidos', 'Canadá', 'Brasil'],
        correcta: 1,
        tipo: 'mundial',
      },
      {
        pregunta: '¿Cuántos equipos participarán en el Mundial 2026?',
        opciones: ['32', '36', '48', '64'],
        correcta: 2,
        tipo: 'mundial',
      },
      {
        pregunta: '¿Cuál selección ha ganado más Mundiales?',
        opciones: ['Alemania', 'Argentina', 'Brasil', 'Italia'],
        correcta: 2,
        tipo: 'mundial',
      },
      {
        pregunta: '¿En qué año se jugó el primer Mundial?',
        opciones: ['1928', '1930', '1934', '1942'],
        correcta: 1,
        tipo: 'mundial',
      },
      {
        pregunta: '¿Cuál fue la sede del Mundial 2022?',
        opciones: ['Rusia', 'Qatar', 'Japón', 'Sudáfrica'],
        correcta: 1,
        tipo: 'mundial',
      },
      {
        pregunta: '¿Quién ganó el Balón de Oro del Mundial 2022?',
        opciones: ['Mbappé', 'Messi', 'Modric', 'Neymar'],
        correcta: 1,
        tipo: 'mundial',
      },
      {
        pregunta: '¿Cuántos goles marcó Kylian Mbappé en la final 2022?',
        opciones: ['1', '2', '3', '4'],
        correcta: 2,
        tipo: 'mundial',
      },
      {
        pregunta: '¿Qué país ha sido sede del Mundial en más ocasiones?',
        opciones: ['México', 'Brasil', 'Italia', 'Alemania'],
        correcta: 0,
        tipo: 'mundial',
      },
      {
        pregunta:
          '¿Cuántos partidos se jugarán en fase de grupos del Mundial 2026?',
        opciones: ['48', '64', '72', '96'],
        correcta: 2,
        tipo: 'mundial',
      },
      {
        pregunta: '¿Qué estadio albergará la final del Mundial 2026?',
        opciones: ['Azteca', 'MetLife Stadium', 'Rose Bowl', 'AT&T Stadium'],
        correcta: 1,
        tipo: 'mundial',
      },
      {
        pregunta:
          '¿Cuál selección suramericana clasificó invicta al Mundial 2026?',
        opciones: ['Brasil', 'Argentina', 'Uruguay', 'Colombia'],
        correcta: 1,
        tipo: 'mundial',
      },
      {
        pregunta: '¿Cuántos grupos tendrá el Mundial 2026?',
        opciones: ['8', '10', '12', '16'],
        correcta: 2,
        tipo: 'mundial',
      },
      {
        pregunta: '¿Qué país centroamericano clasificó al Mundial 2026?',
        opciones: ['Costa Rica', 'Honduras', 'Panamá', 'Guatemala'],
        correcta: 2,
        tipo: 'mundial',
      },
      {
        pregunta: '¿Quién es el máximo goleador histórico de los Mundiales?',
        opciones: ['Ronaldo', 'Klose', 'Pelé', 'Messi'],
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

  private async corregirPreguntasGlobalesLegadas() {
    const correcciones = [
      {
        anterior: 'En que pais se jugara la final del Mundial 2026?',
        pregunta: '¿En qué país se jugará la final del Mundial 2026?',
        opciones: ['México', 'Estados Unidos', 'Canadá', 'Brasil'],
      },
      {
        anterior: 'Cuantos equipos participaran en el Mundial 2026?',
        pregunta: '¿Cuántos equipos participarán en el Mundial 2026?',
        opciones: ['32', '36', '48', '64'],
      },
      {
        anterior: 'Cual seleccion ha ganado mas Mundiales?',
        pregunta: '¿Cuál selección ha ganado más Mundiales?',
        opciones: ['Alemania', 'Argentina', 'Brasil', 'Italia'],
      },
      {
        anterior: 'En que ano se jugo el primer Mundial?',
        pregunta: '¿En qué año se jugó el primer Mundial?',
        opciones: ['1928', '1930', '1934', '1942'],
      },
      {
        anterior: 'Cual fue la sede del Mundial 2022?',
        pregunta: '¿Cuál fue la sede del Mundial 2022?',
        opciones: ['Rusia', 'Qatar', 'Japón', 'Sudáfrica'],
      },
      {
        anterior: 'Quien gano el Balon de Oro del Mundial 2022?',
        pregunta: '¿Quién ganó el Balón de Oro del Mundial 2022?',
        opciones: ['Mbappé', 'Messi', 'Modric', 'Neymar'],
      },
      {
        anterior: 'Cuantos goles marco Kylian Mbappe en la final 2022?',
        pregunta: '¿Cuántos goles marcó Kylian Mbappé en la final 2022?',
        opciones: ['1', '2', '3', '4'],
      },
      {
        anterior: 'Que pais ha sido sede del Mundial en mas ocasiones?',
        pregunta: '¿Qué país ha sido sede del Mundial en más ocasiones?',
        opciones: ['México', 'Brasil', 'Italia', 'Alemania'],
      },
      {
        anterior: 'Cuantos partidos se jugaran en fase de grupos del Mundial 2026?',
        pregunta: '¿Cuántos partidos se jugarán en fase de grupos del Mundial 2026?',
        opciones: ['48', '64', '72', '96'],
      },
      {
        anterior: 'Que estadio albergara la final del Mundial 2026?',
        pregunta: '¿Qué estadio albergará la final del Mundial 2026?',
        opciones: ['Azteca', 'MetLife Stadium', 'Rose Bowl', 'AT&T Stadium'],
      },
      {
        anterior: 'Cual seleccion suramericana clasifico invicta al Mundial 2026?',
        pregunta: '¿Cuál selección suramericana clasificó invicta al Mundial 2026?',
        opciones: ['Brasil', 'Argentina', 'Uruguay', 'Colombia'],
      },
      {
        anterior: 'Cuantos grupos tendra el Mundial 2026?',
        pregunta: '¿Cuántos grupos tendrá el Mundial 2026?',
        opciones: ['8', '10', '12', '16'],
      },
      {
        anterior: 'Que pais centroamericano clasifico al Mundial 2026?',
        pregunta: '¿Qué país centroamericano clasificó al Mundial 2026?',
        opciones: ['Costa Rica', 'Honduras', 'Panamá', 'Guatemala'],
      },
      {
        anterior: 'Quien es el maximo goleador historico de los Mundiales?',
        pregunta: '¿Quién es el máximo goleador histórico de los Mundiales?',
        opciones: ['Ronaldo', 'Klose', 'Pelé', 'Messi'],
      },
    ];

    const porPregunta = new Map(correcciones.map((item) => [item.anterior, item]));
    const preguntas = await this.preguntaRepo.find({
      where: {
        empresa_id: IsNull(),
        pregunta: In(correcciones.map((item) => item.anterior)),
      },
    });

    if (preguntas.length === 0) return;

    for (const pregunta of preguntas) {
      const correccion = porPregunta.get(pregunta.pregunta);
      if (!correccion) continue;
      pregunta.pregunta = correccion.pregunta;
      pregunta.opciones = correccion.opciones;
    }

    await this.preguntaRepo.save(preguntas);
    this.logger.log(`${preguntas.length} preguntas globales legadas corregidas`);
  }
}
