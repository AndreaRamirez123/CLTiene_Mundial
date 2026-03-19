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
    if (fase) where.fase = fase;
    return this.partidoRepo.find({ where, order: { fecha: 'ASC', hora: 'ASC' } });
  }

  async seedPartidos() {
    // Limpiar partidos existentes (desactivar FK temporalmente)
    await this.partidoRepo.query('SET FOREIGN_KEY_CHECKS = 0');
    await this.partidoRepo.clear();
    await this.partidoRepo.query('SET FOREIGN_KEY_CHECKS = 1');

    const e = 'pendiente';
    const f = 'Grupos';

    // ============================================
    // FASE DE GRUPOS - 72 partidos reales FIFA 2026
    // Equipos de playoffs marcados como TBD hasta confirmacion
    // ============================================
    const partidos = [
      // === JORNADA 1 ===
      // Jun 11
      { grupo: 'A', local_equipo: 'México', bandera_local: 'mx', visitante_equipo: 'Sudáfrica', bandera_visitante: 'za', fecha: '2026-06-11', hora: '12:00', fase: f, estado: e },
      { grupo: 'A', local_equipo: 'Corea del Sur', bandera_local: 'kr', visitante_equipo: 'Playoff UEFA D', bandera_visitante: 'eu', fecha: '2026-06-11', hora: '15:00', fase: f, estado: e },
      // Jun 12
      { grupo: 'D', local_equipo: 'Estados Unidos', bandera_local: 'us', visitante_equipo: 'Paraguay', bandera_visitante: 'py', fecha: '2026-06-12', hora: '21:00', fase: f, estado: e },
      { grupo: 'B', local_equipo: 'Canadá', bandera_local: 'ca', visitante_equipo: 'Playoff UEFA A', bandera_visitante: 'eu', fecha: '2026-06-12', hora: '15:00', fase: f, estado: e },
      // Jun 13
      { grupo: 'C', local_equipo: 'Haití', bandera_local: 'ht', visitante_equipo: 'Escocia', bandera_visitante: 'gb-sct', fecha: '2026-06-13', hora: '12:00', fase: f, estado: e },
      { grupo: 'C', local_equipo: 'Brasil', bandera_local: 'br', visitante_equipo: 'Marruecos', bandera_visitante: 'ma', fecha: '2026-06-13', hora: '18:00', fase: f, estado: e },
      { grupo: 'B', local_equipo: 'Qatar', bandera_local: 'qa', visitante_equipo: 'Suiza', bandera_visitante: 'ch', fecha: '2026-06-13', hora: '15:00', fase: f, estado: e },
      { grupo: 'D', local_equipo: 'Australia', bandera_local: 'au', visitante_equipo: 'Playoff UEFA C', bandera_visitante: 'eu', fecha: '2026-06-13', hora: '21:00', fase: f, estado: e },
      // Jun 14
      { grupo: 'F', local_equipo: 'Países Bajos', bandera_local: 'nl', visitante_equipo: 'Japón', bandera_visitante: 'jp', fecha: '2026-06-14', hora: '12:00', fase: f, estado: e },
      { grupo: 'E', local_equipo: 'Alemania', bandera_local: 'de', visitante_equipo: 'Curazao', bandera_visitante: 'cw', fecha: '2026-06-14', hora: '15:00', fase: f, estado: e },
      { grupo: 'E', local_equipo: 'Costa de Marfil', bandera_local: 'ci', visitante_equipo: 'Ecuador', bandera_visitante: 'ec', fecha: '2026-06-14', hora: '18:00', fase: f, estado: e },
      { grupo: 'F', local_equipo: 'Playoff UEFA B', bandera_local: 'eu', visitante_equipo: 'Túnez', bandera_visitante: 'tn', fecha: '2026-06-14', hora: '21:00', fase: f, estado: e },
      // Jun 15
      { grupo: 'H', local_equipo: 'España', bandera_local: 'es', visitante_equipo: 'Cabo Verde', bandera_visitante: 'cv', fecha: '2026-06-15', hora: '12:00', fase: f, estado: e },
      { grupo: 'G', local_equipo: 'Irán', bandera_local: 'ir', visitante_equipo: 'Nueva Zelanda', bandera_visitante: 'nz', fecha: '2026-06-15', hora: '15:00', fase: f, estado: e },
      { grupo: 'H', local_equipo: 'Arabia Saudita', bandera_local: 'sa', visitante_equipo: 'Uruguay', bandera_visitante: 'uy', fecha: '2026-06-15', hora: '18:00', fase: f, estado: e },
      { grupo: 'G', local_equipo: 'Bélgica', bandera_local: 'be', visitante_equipo: 'Egipto', bandera_visitante: 'eg', fecha: '2026-06-15', hora: '21:00', fase: f, estado: e },
      // Jun 16
      { grupo: 'A', local_equipo: 'Playoff UEFA D', bandera_local: 'eu', visitante_equipo: 'Sudáfrica', bandera_visitante: 'za', fecha: '2026-06-16', hora: '12:00', fase: f, estado: e },
      { grupo: 'I', local_equipo: 'Playoff Intercont. 2', bandera_local: 'un', visitante_equipo: 'Noruega', bandera_visitante: 'no', fecha: '2026-06-16', hora: '12:00', fase: f, estado: e },
      { grupo: 'J', local_equipo: 'Argentina', bandera_local: 'ar', visitante_equipo: 'Argelia', bandera_visitante: 'dz', fecha: '2026-06-16', hora: '15:00', fase: f, estado: e },
      { grupo: 'I', local_equipo: 'Francia', bandera_local: 'fr', visitante_equipo: 'Senegal', bandera_visitante: 'sn', fecha: '2026-06-16', hora: '18:00', fase: f, estado: e },
      { grupo: 'J', local_equipo: 'Austria', bandera_local: 'at', visitante_equipo: 'Jordania', bandera_visitante: 'jo', fecha: '2026-06-16', hora: '21:00', fase: f, estado: e },
      // Jun 17
      { grupo: 'L', local_equipo: 'Inglaterra', bandera_local: 'gb-eng', visitante_equipo: 'Croacia', bandera_visitante: 'hr', fecha: '2026-06-17', hora: '12:00', fase: f, estado: e },
      { grupo: 'K', local_equipo: 'Portugal', bandera_local: 'pt', visitante_equipo: 'Playoff Intercont. 1', bandera_visitante: 'un', fecha: '2026-06-17', hora: '15:00', fase: f, estado: e },
      { grupo: 'K', local_equipo: 'Uzbekistán', bandera_local: 'uz', visitante_equipo: 'Colombia', bandera_visitante: 'co', fecha: '2026-06-17', hora: '18:00', fase: f, estado: e },
      { grupo: 'L', local_equipo: 'Ghana', bandera_local: 'gh', visitante_equipo: 'Panamá', bandera_visitante: 'pa', fecha: '2026-06-17', hora: '21:00', fase: f, estado: e },

      // === JORNADA 2 ===
      // Jun 18
      { grupo: 'A', local_equipo: 'México', bandera_local: 'mx', visitante_equipo: 'Corea del Sur', bandera_visitante: 'kr', fecha: '2026-06-18', hora: '12:00', fase: f, estado: e },
      { grupo: 'B', local_equipo: 'Suiza', bandera_local: 'ch', visitante_equipo: 'Playoff UEFA A', bandera_visitante: 'eu', fecha: '2026-06-18', hora: '15:00', fase: f, estado: e },
      { grupo: 'B', local_equipo: 'Canadá', bandera_local: 'ca', visitante_equipo: 'Qatar', bandera_visitante: 'qa', fecha: '2026-06-18', hora: '18:00', fase: f, estado: e },
      // Jun 19
      { grupo: 'C', local_equipo: 'Escocia', bandera_local: 'gb-sct', visitante_equipo: 'Marruecos', bandera_visitante: 'ma', fecha: '2026-06-19', hora: '12:00', fase: f, estado: e },
      { grupo: 'C', local_equipo: 'Brasil', bandera_local: 'br', visitante_equipo: 'Haití', bandera_visitante: 'ht', fecha: '2026-06-19', hora: '15:00', fase: f, estado: e },
      { grupo: 'D', local_equipo: 'Playoff UEFA C', bandera_local: 'eu', visitante_equipo: 'Paraguay', bandera_visitante: 'py', fecha: '2026-06-19', hora: '18:00', fase: f, estado: e },
      { grupo: 'D', local_equipo: 'Estados Unidos', bandera_local: 'us', visitante_equipo: 'Australia', bandera_visitante: 'au', fecha: '2026-06-19', hora: '21:00', fase: f, estado: e },
      // Jun 20
      { grupo: 'F', local_equipo: 'Países Bajos', bandera_local: 'nl', visitante_equipo: 'Playoff UEFA B', bandera_visitante: 'eu', fecha: '2026-06-20', hora: '12:00', fase: f, estado: e },
      { grupo: 'E', local_equipo: 'Ecuador', bandera_local: 'ec', visitante_equipo: 'Curazao', bandera_visitante: 'cw', fecha: '2026-06-20', hora: '15:00', fase: f, estado: e },
      { grupo: 'E', local_equipo: 'Alemania', bandera_local: 'de', visitante_equipo: 'Costa de Marfil', bandera_visitante: 'ci', fecha: '2026-06-20', hora: '18:00', fase: f, estado: e },
      { grupo: 'F', local_equipo: 'Túnez', bandera_local: 'tn', visitante_equipo: 'Japón', bandera_visitante: 'jp', fecha: '2026-06-20', hora: '21:00', fase: f, estado: e },
      // Jun 21
      { grupo: 'H', local_equipo: 'España', bandera_local: 'es', visitante_equipo: 'Arabia Saudita', bandera_visitante: 'sa', fecha: '2026-06-21', hora: '12:00', fase: f, estado: e },
      { grupo: 'G', local_equipo: 'Bélgica', bandera_local: 'be', visitante_equipo: 'Irán', bandera_visitante: 'ir', fecha: '2026-06-21', hora: '15:00', fase: f, estado: e },
      { grupo: 'H', local_equipo: 'Uruguay', bandera_local: 'uy', visitante_equipo: 'Cabo Verde', bandera_visitante: 'cv', fecha: '2026-06-21', hora: '18:00', fase: f, estado: e },
      { grupo: 'G', local_equipo: 'Nueva Zelanda', bandera_local: 'nz', visitante_equipo: 'Egipto', bandera_visitante: 'eg', fecha: '2026-06-21', hora: '21:00', fase: f, estado: e },
      // Jun 22
      { grupo: 'J', local_equipo: 'Argentina', bandera_local: 'ar', visitante_equipo: 'Austria', bandera_visitante: 'at', fecha: '2026-06-22', hora: '12:00', fase: f, estado: e },
      { grupo: 'J', local_equipo: 'Jordania', bandera_local: 'jo', visitante_equipo: 'Argelia', bandera_visitante: 'dz', fecha: '2026-06-22', hora: '15:00', fase: f, estado: e },
      { grupo: 'I', local_equipo: 'Francia', bandera_local: 'fr', visitante_equipo: 'Playoff Intercont. 2', bandera_visitante: 'un', fecha: '2026-06-22', hora: '18:00', fase: f, estado: e },
      { grupo: 'I', local_equipo: 'Noruega', bandera_local: 'no', visitante_equipo: 'Senegal', bandera_visitante: 'sn', fecha: '2026-06-22', hora: '21:00', fase: f, estado: e },
      // Jun 23
      { grupo: 'L', local_equipo: 'Inglaterra', bandera_local: 'gb-eng', visitante_equipo: 'Ghana', bandera_visitante: 'gh', fecha: '2026-06-23', hora: '12:00', fase: f, estado: e },
      { grupo: 'K', local_equipo: 'Colombia', bandera_local: 'co', visitante_equipo: 'Playoff Intercont. 1', bandera_visitante: 'un', fecha: '2026-06-23', hora: '15:00', fase: f, estado: e },
      { grupo: 'K', local_equipo: 'Portugal', bandera_local: 'pt', visitante_equipo: 'Uzbekistán', bandera_visitante: 'uz', fecha: '2026-06-23', hora: '18:00', fase: f, estado: e },
      { grupo: 'L', local_equipo: 'Panamá', bandera_local: 'pa', visitante_equipo: 'Croacia', bandera_visitante: 'hr', fecha: '2026-06-23', hora: '21:00', fase: f, estado: e },

      // === JORNADA 3 (partidos simultáneos por grupo) ===
      // Jun 24
      { grupo: 'C', local_equipo: 'Marruecos', bandera_local: 'ma', visitante_equipo: 'Haití', bandera_visitante: 'ht', fecha: '2026-06-24', hora: '12:00', fase: f, estado: e },
      { grupo: 'C', local_equipo: 'Escocia', bandera_local: 'gb-sct', visitante_equipo: 'Brasil', bandera_visitante: 'br', fecha: '2026-06-24', hora: '12:00', fase: f, estado: e },
      { grupo: 'B', local_equipo: 'Playoff UEFA A', bandera_local: 'eu', visitante_equipo: 'Qatar', bandera_visitante: 'qa', fecha: '2026-06-24', hora: '18:00', fase: f, estado: e },
      { grupo: 'B', local_equipo: 'Suiza', bandera_local: 'ch', visitante_equipo: 'Canadá', bandera_visitante: 'ca', fecha: '2026-06-24', hora: '18:00', fase: f, estado: e },
      { grupo: 'A', local_equipo: 'Sudáfrica', bandera_local: 'za', visitante_equipo: 'Corea del Sur', bandera_visitante: 'kr', fecha: '2026-06-24', hora: '21:00', fase: f, estado: e },
      { grupo: 'A', local_equipo: 'Playoff UEFA D', bandera_local: 'eu', visitante_equipo: 'México', bandera_visitante: 'mx', fecha: '2026-06-24', hora: '21:00', fase: f, estado: e },
      // Jun 25
      { grupo: 'F', local_equipo: 'Japón', bandera_local: 'jp', visitante_equipo: 'Playoff UEFA B', bandera_visitante: 'eu', fecha: '2026-06-25', hora: '12:00', fase: f, estado: e },
      { grupo: 'F', local_equipo: 'Túnez', bandera_local: 'tn', visitante_equipo: 'Países Bajos', bandera_visitante: 'nl', fecha: '2026-06-25', hora: '12:00', fase: f, estado: e },
      { grupo: 'E', local_equipo: 'Curazao', bandera_local: 'cw', visitante_equipo: 'Costa de Marfil', bandera_visitante: 'ci', fecha: '2026-06-25', hora: '15:00', fase: f, estado: e },
      { grupo: 'E', local_equipo: 'Ecuador', bandera_local: 'ec', visitante_equipo: 'Alemania', bandera_visitante: 'de', fecha: '2026-06-25', hora: '15:00', fase: f, estado: e },
      { grupo: 'D', local_equipo: 'Paraguay', bandera_local: 'py', visitante_equipo: 'Australia', bandera_visitante: 'au', fecha: '2026-06-25', hora: '18:00', fase: f, estado: e },
      { grupo: 'D', local_equipo: 'Playoff UEFA C', bandera_local: 'eu', visitante_equipo: 'Estados Unidos', bandera_visitante: 'us', fecha: '2026-06-25', hora: '18:00', fase: f, estado: e },
      // Jun 26
      { grupo: 'H', local_equipo: 'Uruguay', bandera_local: 'uy', visitante_equipo: 'España', bandera_visitante: 'es', fecha: '2026-06-26', hora: '12:00', fase: f, estado: e },
      { grupo: 'H', local_equipo: 'Cabo Verde', bandera_local: 'cv', visitante_equipo: 'Arabia Saudita', bandera_visitante: 'sa', fecha: '2026-06-26', hora: '12:00', fase: f, estado: e },
      { grupo: 'G', local_equipo: 'Egipto', bandera_local: 'eg', visitante_equipo: 'Irán', bandera_visitante: 'ir', fecha: '2026-06-26', hora: '15:00', fase: f, estado: e },
      { grupo: 'G', local_equipo: 'Nueva Zelanda', bandera_local: 'nz', visitante_equipo: 'Bélgica', bandera_visitante: 'be', fecha: '2026-06-26', hora: '15:00', fase: f, estado: e },
      { grupo: 'I', local_equipo: 'Senegal', bandera_local: 'sn', visitante_equipo: 'Playoff Intercont. 2', bandera_visitante: 'un', fecha: '2026-06-26', hora: '18:00', fase: f, estado: e },
      { grupo: 'I', local_equipo: 'Noruega', bandera_local: 'no', visitante_equipo: 'Francia', bandera_visitante: 'fr', fecha: '2026-06-26', hora: '18:00', fase: f, estado: e },
      { grupo: 'K', local_equipo: 'Colombia', bandera_local: 'co', visitante_equipo: 'Portugal', bandera_visitante: 'pt', fecha: '2026-06-26', hora: '21:00', fase: f, estado: e },
      // Jun 27
      { grupo: 'K', local_equipo: 'Playoff Intercont. 1', bandera_local: 'un', visitante_equipo: 'Uzbekistán', bandera_visitante: 'uz', fecha: '2026-06-27', hora: '12:00', fase: f, estado: e },
      { grupo: 'J', local_equipo: 'Argelia', bandera_local: 'dz', visitante_equipo: 'Austria', bandera_visitante: 'at', fecha: '2026-06-27', hora: '15:00', fase: f, estado: e },
      { grupo: 'J', local_equipo: 'Jordania', bandera_local: 'jo', visitante_equipo: 'Argentina', bandera_visitante: 'ar', fecha: '2026-06-27', hora: '15:00', fase: f, estado: e },
      { grupo: 'L', local_equipo: 'Panamá', bandera_local: 'pa', visitante_equipo: 'Inglaterra', bandera_visitante: 'gb-eng', fecha: '2026-06-27', hora: '18:00', fase: f, estado: e },
      { grupo: 'L', local_equipo: 'Croacia', bandera_local: 'hr', visitante_equipo: 'Ghana', bandera_visitante: 'gh', fecha: '2026-06-27', hora: '18:00', fase: f, estado: e },
    ];

    const entities = partidos.map((p) => this.partidoRepo.create(p as Partial<Partido>));
    await this.partidoRepo.save(entities);
    return { mensaje: `${partidos.length} partidos de fase de grupos creados` };
  }

  async actualizarResultado(id: string, goles_local: number, goles_visitante: number) {
    const partidoId = parseInt(id, 10);
    const resultado =
      goles_local > goles_visitante ? 'local'
        : goles_visitante > goles_local ? 'visitante'
          : 'empate';

    await this.partidoRepo.update(partidoId, {
      goles_local,
      goles_visitante,
      resultado,
      estado: 'finalizado',
    });

    return { mensaje: 'Resultado actualizado' };
  }

  // Actualizar nombre y bandera de equipo de playoff cuando se confirme
  async actualizarEquipoPlayoff(placeholder: string, nombreReal: string, banderaReal: string) {
    // Actualizar como local
    await this.partidoRepo
      .createQueryBuilder()
      .update(Partido)
      .set({ local_equipo: nombreReal, bandera_local: banderaReal })
      .where('local_equipo = :placeholder', { placeholder })
      .execute();

    // Actualizar como visitante
    await this.partidoRepo
      .createQueryBuilder()
      .update(Partido)
      .set({ visitante_equipo: nombreReal, bandera_visitante: banderaReal })
      .where('visitante_equipo = :placeholder', { placeholder })
      .execute();

    return { mensaje: `Equipo "${placeholder}" reemplazado por "${nombreReal}"` };
  }
}
