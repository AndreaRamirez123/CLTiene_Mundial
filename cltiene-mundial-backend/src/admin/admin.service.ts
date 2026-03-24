import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Jugador } from '../entities/jugador.entity';
import { Prediccion } from '../entities/prediccion.entity';
import { Transaccion } from '../entities/transaccion.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Jugador)
    private jugadorRepo: Repository<Jugador>,
    @InjectRepository(Prediccion)
    private prediccionRepo: Repository<Prediccion>,
    @InjectRepository(Transaccion)
    private transaccionRepo: Repository<Transaccion>,
  ) {}

  // Obtener todos los jugadores
  async obtenerTodosLosJugadores(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.jugadorRepo.findAndCount({
      order: { monedas: 'DESC' },
      skip,
      take: limit,
    });

    return {
      jugadores: data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  // Obtener detalles completos de un jugador
  async obtenerDetalleJugador(uid: string) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) return null;

    const predicciones = await this.prediccionRepo.find({
      where: { jugador_id: jugador.id },
      order: { created_at: 'DESC' },
      take: 50,
    });

    const transacciones = await this.transaccionRepo.find({
      where: { jugador_id: jugador.id },
      order: { created_at: 'DESC' },
      take: 50,
    });

    return {
      jugador,
      predicciones: predicciones.length,
      transacciones,
      monedas_totales_ganadas: jugador.monedas_totales_ganadas,
      predicciones_acertadas: jugador.predicciones_acertadas,
    };
  }

  // Obtener predicciones sin validar (resultado aún no definido)
  async obtenerPrediccionesSinValidar() {
    return this.prediccionRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.jugador', 'jugador')
      .leftJoinAndSelect('p.partido', 'partido')
      .where('p.resultado IS NULL')
      .orderBy('p.created_at', 'DESC')
      .limit(100)
      .getMany();
  }

  // Obtener estadísticas globales
  async obtenerEstadisticas() {
    const totalJugadores = await this.jugadorRepo.count();
    const totalPredicciones = await this.prediccionRepo.count();
    const totalMonedas = await this.jugadorRepo
      .createQueryBuilder('j')
      .select('SUM(j.monedas)', 'total')
      .getRawOne();

    const adminCount = await this.jugadorRepo.count({
      where: { rol: 'admin' },
    });

    return {
      total_jugadores: totalJugadores,
      total_predicciones: totalPredicciones,
      total_monedas_en_circulacion: parseInt(totalMonedas.total) || 0,
      admins: adminCount,
      fecha: new Date(),
    };
  }

  // Convertir usuario a admin
  async convertirAAdmin(uid: string) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) return null;

    jugador.rol = 'admin';
    return this.jugadorRepo.save(jugador);
  }

  // Revocar permisos de admin
  async revocarAdmin(uid: string) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) return null;

    jugador.rol = 'jugador';
    return this.jugadorRepo.save(jugador);
  }
}
