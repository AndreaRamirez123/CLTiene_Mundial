import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partido } from '../entities/partido.entity';

@Injectable()
export class PartidosService {
  constructor(
    @InjectRepository(Partido)
    private readonly partidoRepo: Repository<Partido>,
  ) {}

  async getPartidos(fase?: string) {
    const where: Record<string, unknown> = {};
    if (fase) {
      where.fase = fase;
    }

    return this.partidoRepo.find({
      where,
      order: { fecha: 'ASC', hora: 'ASC' },
    });
  }

  async seedPartidos() {
    const partidos = [
      { grupo: 'A', local_equipo: 'Qatar', bandera_local: 'qa', visitante_equipo: 'Ecuador', bandera_visitante: 'ec', fecha: '2026-06-11', hora: '12:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'B', local_equipo: 'Inglaterra', bandera_local: 'gb-eng', visitante_equipo: 'Irán', bandera_visitante: 'ir', fecha: '2026-06-11', hora: '15:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'A', local_equipo: 'Senegal', bandera_local: 'sn', visitante_equipo: 'Países Bajos', bandera_visitante: 'nl', fecha: '2026-06-11', hora: '18:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'B', local_equipo: 'Estados Unidos', bandera_local: 'us', visitante_equipo: 'Gales', bandera_visitante: 'gb-wls', fecha: '2026-06-12', hora: '12:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'C', local_equipo: 'Argentina', bandera_local: 'ar', visitante_equipo: 'Arabia S.', bandera_visitante: 'sa', fecha: '2026-06-12', hora: '15:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'D', local_equipo: 'Dinamarca', bandera_local: 'dk', visitante_equipo: 'Túnez', bandera_visitante: 'tn', fecha: '2026-06-12', hora: '18:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'C', local_equipo: 'México', bandera_local: 'mx', visitante_equipo: 'Polonia', bandera_visitante: 'pl', fecha: '2026-06-13', hora: '12:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'D', local_equipo: 'Francia', bandera_local: 'fr', visitante_equipo: 'Australia', bandera_visitante: 'au', fecha: '2026-06-13', hora: '15:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'E', local_equipo: 'Alemania', bandera_local: 'de', visitante_equipo: 'Japón', bandera_visitante: 'jp', fecha: '2026-06-13', hora: '18:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'E', local_equipo: 'España', bandera_local: 'es', visitante_equipo: 'Costa Rica', bandera_visitante: 'cr', fecha: '2026-06-14', hora: '12:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'F', local_equipo: 'Bélgica', bandera_local: 'be', visitante_equipo: 'Canadá', bandera_visitante: 'ca', fecha: '2026-06-14', hora: '15:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'F', local_equipo: 'Brasil', bandera_local: 'br', visitante_equipo: 'Serbia', bandera_visitante: 'rs', fecha: '2026-06-14', hora: '18:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'G', local_equipo: 'Portugal', bandera_local: 'pt', visitante_equipo: 'Ghana', bandera_visitante: 'gh', fecha: '2026-06-15', hora: '12:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'G', local_equipo: 'Uruguay', bandera_local: 'uy', visitante_equipo: 'Corea del Sur', bandera_visitante: 'kr', fecha: '2026-06-15', hora: '15:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'H', local_equipo: 'Colombia', bandera_local: 'co', visitante_equipo: 'Marruecos', bandera_visitante: 'ma', fecha: '2026-06-15', hora: '18:00', fase: 'Grupos', estado: 'pendiente' },
      { grupo: 'H', local_equipo: 'Croacia', bandera_local: 'hr', visitante_equipo: 'Ecuador', bandera_visitante: 'ec', fecha: '2026-06-16', hora: '12:00', fase: 'Grupos', estado: 'pendiente' },
    ];

    const entities = partidos.map((p) => this.partidoRepo.create(p as Partial<Partido>));
    await this.partidoRepo.save(entities);
    return { mensaje: `${partidos.length} partidos creados exitosamente` };
  }

  async actualizarResultado(id: string, goles_local: number, goles_visitante: number) {
    const partidoId = parseInt(id, 10);
    const resultado =
      goles_local > goles_visitante
        ? 'local'
        : goles_visitante > goles_local
          ? 'visitante'
          : 'empate';

    await this.partidoRepo.update(partidoId, {
      goles_local,
      goles_visitante,
      resultado,
      estado: 'finalizado',
    });

    return { mensaje: 'Resultado actualizado' };
  }
}
