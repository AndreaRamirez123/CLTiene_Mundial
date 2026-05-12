import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Partido } from '../entities/partido.entity';
import { PartidosService } from './partidos.service';
import { PrediccionesService } from '../predicciones/predicciones.service';

type ResultadoIA = {
  goles_local: number;
  goles_visitante: number;
  fuente?: string;
  url?: string;
  status?: string;
};

@Injectable()
export class ResultadosAutoService {
  private readonly logger = new Logger(ResultadosAutoService.name);
  private warnedNoKey = false;

  constructor(
    @InjectRepository(Partido)
    private readonly partidoRepo: Repository<Partido>,
    private readonly partidosService: PartidosService,
    private readonly prediccionesService: PrediccionesService,
    private readonly config: ConfigService,
  ) {}

  @Cron('*/5 * * * *')
  async actualizarResultados() {
    const apiKey = this.config.get<string>('OPENAI_API_MUNDIAL') || '';
    if (!apiKey) {
      if (!this.warnedNoKey) {
        this.logger.warn(
          'OPENAI_API_MUNDIAL no configurada; resultados IA desactivados',
        );
        this.warnedNoKey = true;
      }
      return { mensaje: 'OPENAI_API_MUNDIAL no configurada', actualizados: 0 };
    }

    const maxPorCiclo = Number(
      this.config.get('OPENAI_MAX_MATCHES_PER_RUN') || 5,
    );
    const ahora = new Date();
    const umbral = new Date(ahora.getTime() - 105 * 60 * 1000);

    const pendientes = await this.partidoRepo.find({
      where: { estado: 'pendiente' },
      order: { fecha: 'ASC', hora: 'ASC' },
    });

    const candidatos = pendientes.filter((p) => {
      if (!p.fecha || !p.hora) return false;
      const fechaHora = new Date(`${p.fecha}T${p.hora}:00`);
      if (isNaN(fechaHora.getTime())) return false;
      if (fechaHora > umbral) return false;
      const local = (p.local_equipo || '').toLowerCase();
      const visitante = (p.visitante_equipo || '').toLowerCase();
      if (local.includes('playoff') || visitante.includes('playoff'))
        return false;
      if (local.includes('tbd') || visitante.includes('tbd')) return false;
      return true;
    });

    const resultados: string[] = [];

    for (const partido of candidatos.slice(0, maxPorCiclo)) {
      const resultado = await this.buscarResultadoConWebSearch(partido, apiKey);
      if (!resultado || resultado.status === 'no_result') {
        resultados.push(`${partido.local_equipo} vs ${partido.visitante_equipo}: sin resultado aún`);
        continue;
      }
      if (
        typeof resultado.goles_local !== 'number' ||
        typeof resultado.goles_visitante !== 'number'
      ) {
        resultados.push(`${partido.local_equipo} vs ${partido.visitante_equipo}: respuesta inválida`);
        continue;
      }

      await this.partidosService.actualizarResultado(
        String(partido.id),
        resultado.goles_local,
        resultado.goles_visitante,
      );

      await this.prediccionesService.resolverPrediccionesPartido(partido.id);

      const msg = `${partido.local_equipo} ${resultado.goles_local}-${resultado.goles_visitante} ${partido.visitante_equipo}`;
      resultados.push(msg);
      this.logger.log(`Resultado actualizado: ${msg}`);
    }

    return {
      mensaje: `${resultados.length} partidos procesados de ${candidatos.length} candidatos`,
      resultados,
    };
  }

  private async buscarResultadoConWebSearch(partido: Partido, apiKey: string) {
    const model = this.config.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';

    const prompt = `Busca el resultado FINAL del partido "${partido.local_equipo} vs ${partido.visitante_equipo}" jugado el ${partido.fecha}.

IMPORTANTE: Solo devuelve el resultado si el partido YA TERMINÓ (tiempo completo). Si el partido está en curso, en vivo, o no ha terminado, responde con no_result.

Devuelve SOLO JSON con este formato exacto:
{"goles_local":0,"goles_visitante":0,"fuente":"","url":""}

Si el partido no ha terminado, está en curso, o no encuentras resultado final confirmado, responde SOLO:
{"status":"no_result"}`;

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        tools: [{ type: 'web_search' }],
        tool_choice: 'required',
        input: prompt,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`OpenAI web_search fallo (${res.status}): ${text}`);
      return null;
    }

    const data = await res.json();
    const output = Array.isArray(data.output) ? data.output : [];
    const text = this.extraerTexto(output);
    return this.parsearJsonSeguro(text);
  }

  private extraerTexto(output: any[]): string {
    for (const item of output) {
      if (item?.type === 'message' && Array.isArray(item.content)) {
        const chunk = item.content.find((c: any) => c.type === 'output_text');
        if (chunk?.text) return String(chunk.text);
      }
    }
    return '';
  }

  private parsearJsonSeguro(texto: string): ResultadoIA | null {
    if (!texto) return null;
    const clean = texto
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    try {
      return JSON.parse(clean) as ResultadoIA;
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try {
        return JSON.parse(match[0]) as ResultadoIA;
      } catch {
        return null;
      }
    }
  }
}
