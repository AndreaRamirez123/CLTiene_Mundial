import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Jugador } from '../entities/jugador.entity';

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(Jugador)
    private readonly jugadorRepo: Repository<Jugador>,
  ) {}

  async getRanking(limit = 10) {
    const jugadores = await this.jugadorRepo.find({
      order: { monedas: 'DESC' },
      take: limit,
      select: [
        'id',
        'uid',
        'nombre',
        'monedas',
        'nivel',
        'predicciones_count',
        'predicciones_acertadas',
        'goles',
      ],
    });

    return jugadores.map((j, index) => ({
      posicion: index + 1,
      id: j.id,
      uid: j.uid,
      nombre: j.nombre || 'Jugador anónimo',
      monedas: j.monedas,
      nivel: j.nivel,
      predicciones: j.predicciones_count,
      predicciones_acertadas: j.predicciones_acertadas,
      goles: j.goles,
    }));
  }
}
