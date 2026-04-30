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

  async getRanking(empresaId: number, limit = 10) {
    // El ranking del Mundial se ordena por GOLES (acumulados al acertar predicciones).
    // Desempate: predicciones acertadas DESC, luego monedas DESC.
    const jugadores = await this.jugadorRepo.find({
      where: { empresa_id: empresaId },
      order: {
        goles: 'DESC',
        predicciones_acertadas: 'DESC',
        monedas: 'DESC',
      },
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
      goles: j.goles,
      monedas: j.monedas,
      nivel: j.nivel,
      predicciones: j.predicciones_count,
      predicciones_acertadas: j.predicciones_acertadas,
    }));
  }
}
