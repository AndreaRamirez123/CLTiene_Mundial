import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Jugador } from '../entities/jugador.entity';
import { Prediccion } from '../entities/prediccion.entity';
import { Partido } from '../entities/partido.entity';

@Injectable()
export class PrediccionesService {
  constructor(
    @InjectRepository(Jugador)
    private readonly jugadorRepo: Repository<Jugador>,
    @InjectRepository(Prediccion)
    private readonly prediccionRepo: Repository<Prediccion>,
    @InjectRepository(Partido)
    private readonly partidoRepo: Repository<Partido>,
    private readonly dataSource: DataSource,
  ) {}

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
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) {
      throw new BadRequestException('Jugador no encontrado');
    }

    const partidoId = parseInt(datos.partido_id, 10);

    // Verificar que el partido existe
    const partido = await this.partidoRepo.findOne({ where: { id: partidoId } });
    if (!partido) {
      throw new BadRequestException('Partido no encontrado');
    }

    // Verificar que no exista predicción previa para este partido
    const existente = await this.prediccionRepo.findOne({
      where: { jugador_id: jugador.id, partido_id: partidoId },
    });

    if (existente) {
      throw new BadRequestException(
        'Ya tienes una predicción para este partido',
      );
    }

    // Predicciones son GRATUITAS - NO se descuentan monedas
    let prediccion: Prediccion;

    await this.dataSource.transaction(async (manager) => {
      prediccion = await manager.save(Prediccion, {
        jugador_id: jugador.id,
        partido_id: partidoId,
        resultado: datos.resultado,
        goles_local: datos.goles_local,
        goles_visitante: datos.goles_visitante,
        estado: 'pendiente',
      });

      jugador.predicciones_count = (jugador.predicciones_count || 0) + 1;
      jugador.ultimo_acceso = new Date();
      await manager.save(Jugador, jugador);
    });

    return { mensaje: '¡Predicción guardada! Buena suerte', id: prediccion!.id };
  }

  async getPrediccionesUsuario(uid: string) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) return [];

    return this.prediccionRepo.find({
      where: { jugador_id: jugador.id },
      relations: ['partido'],
      order: { created_at: 'DESC' },
    });
  }
}
