import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Jugador } from '../entities/jugador.entity';
import { Prediccion } from '../entities/prediccion.entity';
import { Transaccion } from '../entities/transaccion.entity';

const SUPERADMIN_EMAILS = ['andrea_ramirezt@cun.edu.co'];
const ADMIN_EMAILS: string[] = ['andrearamirezt1992@gmail.com'];

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Jugador)
    private jugadorRepo: Repository<Jugador>,
    @InjectRepository(Prediccion)
    private prediccionRepo: Repository<Prediccion>,
    @InjectRepository(Transaccion)
    private transaccionRepo: Repository<Transaccion>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    for (const email of SUPERADMIN_EMAILS) {
      const jugadores = await this.jugadorRepo.find({
        where: [{ email }, { correo: email }],
      });
      for (const jugador of jugadores) {
        if (jugador.rol !== 'superadmin') {
          jugador.rol = 'superadmin';
          await this.jugadorRepo.save(jugador);
          this.logger.log(
            `Superadmin seed: ${email} (uid: ${jugador.uid}) promovido a superadmin`,
          );
        }
      }
    }

    for (const email of ADMIN_EMAILS) {
      const jugadores = await this.jugadorRepo.find({
        where: [{ email }, { correo: email }],
      });
      for (const jugador of jugadores) {
        if (jugador.rol !== 'admin') {
          jugador.rol = 'admin';
          await this.jugadorRepo.save(jugador);
          this.logger.log(
            `Admin seed: ${email} (uid: ${jugador.uid}) promovido a admin`,
          );
        }
      }
    }
  }

  // Obtener todos los jugadores (filtrado por empresa si es admin, global si superadmin)
  async obtenerTodosLosJugadores(page = 1, limit = 20, empresaId?: number) {
    const skip = (page - 1) * limit;
    const where = empresaId ? { empresa_id: empresaId } : {};
    const [data, total] = await this.jugadorRepo.findAndCount({
      where,
      relations: ['empresa'],
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

  // Obtener estadísticas
  async obtenerEstadisticas(empresaId?: number) {
    const whereJugador = empresaId ? { empresa_id: empresaId } : {};
    const totalJugadores = await this.jugadorRepo.count({
      where: whereJugador,
    });

    const qbPredicciones = this.prediccionRepo.createQueryBuilder('p');
    if (empresaId) {
      qbPredicciones
        .innerJoin('p.jugador', 'j')
        .where('j.empresa_id = :empresaId', { empresaId });
    }
    const totalPredicciones = await qbPredicciones.getCount();

    const qbMonedas = this.jugadorRepo
      .createQueryBuilder('j')
      .select('SUM(j.monedas)', 'total');
    if (empresaId) {
      qbMonedas.where('j.empresa_id = :empresaId', { empresaId });
    }
    const totalMonedas = await qbMonedas.getRawOne();

    const adminCount = await this.jugadorRepo.count({
      where: empresaId
        ? { rol: 'admin', empresa_id: empresaId }
        : { rol: 'admin' },
    });

    // Actividad real basada en ultimo_acceso
    const buildActivityQuery = (condition: string) => {
      const qb = this.jugadorRepo.createQueryBuilder('j').where(condition);
      if (empresaId) qb.andWhere('j.empresa_id = :empresaId', { empresaId });
      return qb.getCount();
    };

    const [activosHoy, activosSemana, activosMes] = await Promise.all([
      buildActivityQuery('j.ultimo_acceso >= CURDATE()'),
      buildActivityQuery(
        'j.ultimo_acceso >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)',
      ),
      buildActivityQuery(
        'j.ultimo_acceso >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)',
      ),
    ]);

    const inactivos = totalJugadores - activosMes;

    const actividad = {
      hoy: activosHoy,
      semana: activosSemana,
      mes: activosMes,
      inactivos,
    };

    // Jugadores por nivel (campo enum)
    const porNivel = await this.jugadorRepo
      .createQueryBuilder('j')
      .select('j.nivel', 'nivel')
      .addSelect('COUNT(*)', 'cantidad')
      .where(empresaId ? 'j.empresa_id = :empresaId' : '1=1', { empresaId })
      .groupBy('j.nivel')
      .getRawMany();

    // Jugadores por empresa (solo superadmin)
    let porEmpresa: any[] = [];
    if (!empresaId) {
      porEmpresa = await this.jugadorRepo
        .createQueryBuilder('j')
        .innerJoin('j.empresa', 'e')
        .select('e.nombre', 'empresa')
        .addSelect('COUNT(*)', 'jugadores')
        .addSelect('SUM(j.monedas)', 'monedas')
        .groupBy('e.nombre')
        .orderBy('jugadores', 'DESC')
        .getRawMany();
    }

    // Engagement: usuarios que han participado
    const qbConPredicciones = this.jugadorRepo
      .createQueryBuilder('j')
      .where('j.predicciones_count > 0');
    if (empresaId)
      qbConPredicciones.andWhere('j.empresa_id = :empresaId', { empresaId });
    const jugadoresConPredicciones = await qbConPredicciones.getCount();

    const qbConTrivia = this.jugadorRepo
      .createQueryBuilder('j')
      .where('j.trivias_jugadas > 0');
    if (empresaId)
      qbConTrivia.andWhere('j.empresa_id = :empresaId', { empresaId });
    const jugadoresConTrivia = await qbConTrivia.getCount();

    const qbConReferidos = this.jugadorRepo
      .createQueryBuilder('j')
      .where('j.referidos_count > 0');
    if (empresaId)
      qbConReferidos.andWhere('j.empresa_id = :empresaId', { empresaId });
    const jugadoresConReferidos = await qbConReferidos.getCount();

    const engagement = {
      con_predicciones: jugadoresConPredicciones,
      con_trivia: jugadoresConTrivia,
      con_referidos: jugadoresConReferidos,
      total: totalJugadores,
    };

    // Jugadores por rol (admin no ve superadmins, superadmin ve todo)
    const qbRol = this.jugadorRepo
      .createQueryBuilder('j')
      .select('j.rol', 'rol')
      .addSelect('COUNT(*)', 'cantidad');
    if (empresaId) {
      qbRol
        .where('j.empresa_id = :empresaId', { empresaId })
        .andWhere("j.rol != 'superadmin'");
    }
    qbRol.groupBy('j.rol');
    const porRol = await qbRol.getRawMany();

    return {
      total_jugadores: totalJugadores,
      total_predicciones: totalPredicciones,
      total_monedas_en_circulacion: parseInt(totalMonedas.total) || 0,
      admins: adminCount,
      fecha: new Date(),
      actividad,
      engagement,
      por_nivel: porNivel,
      por_empresa: porEmpresa,
      por_rol: porRol,
    };
  }

  // Georreferenciación: jugadores por departamento y ciudad
  async obtenerGeorreferenciacion(empresaId?: number) {
    const addEmpresaFilter = (qb: any) => {
      if (empresaId) qb.andWhere('j.empresa_id = :empresaId', { empresaId });
      return qb;
    };

    const qbDep = this.jugadorRepo
      .createQueryBuilder('j')
      .select('j.departamento', 'departamento')
      .addSelect('COUNT(*)', 'cantidad')
      .where("j.departamento != ''")
      .groupBy('j.departamento')
      .orderBy('cantidad', 'DESC');
    addEmpresaFilter(qbDep);
    const porDepartamento = await qbDep.getRawMany();

    const qbCiudad = this.jugadorRepo
      .createQueryBuilder('j')
      .select('j.departamento', 'departamento')
      .addSelect('j.ciudad', 'ciudad')
      .addSelect('COUNT(*)', 'cantidad')
      .where("j.ciudad != ''")
      .groupBy('j.departamento')
      .addGroupBy('j.ciudad')
      .orderBy('cantidad', 'DESC');
    addEmpresaFilter(qbCiudad);
    const porCiudad = await qbCiudad.getRawMany();

    const qbCon = this.jugadorRepo
      .createQueryBuilder('j')
      .where("j.departamento != ''");
    addEmpresaFilter(qbCon);
    const totalConUbicacion = await qbCon.getCount();

    const qbSin = this.jugadorRepo
      .createQueryBuilder('j')
      .where("j.departamento = '' OR j.departamento IS NULL");
    addEmpresaFilter(qbSin);
    const totalSinUbicacion = await qbSin.getCount();

    return {
      por_departamento: porDepartamento,
      por_ciudad: porCiudad,
      total_con_ubicacion: totalConUbicacion,
      total_sin_ubicacion: totalSinUbicacion,
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

  // Eliminar jugador y todos sus datos
  async eliminarJugador(uid: string) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) return { mensaje: 'Jugador no encontrado.' };

    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      await runner.query('SET FOREIGN_KEY_CHECKS = 0');
      await runner.query(`DELETE FROM trivias_historial WHERE jugador_id = ?`, [jugador.id]);
      await runner.query(`DELETE FROM transacciones WHERE jugador_id = ?`, [jugador.id]);
      await runner.query(`DELETE FROM canjes WHERE jugador_id = ?`, [jugador.id]);
      await runner.query(`DELETE FROM notificaciones_log WHERE jugador_id = ?`, [jugador.id]);
      await runner.query(`DELETE FROM sso_sessions WHERE jugador_id = ?`, [jugador.id]);
      await runner.query(`DELETE FROM predicciones WHERE jugador_id = ?`, [jugador.id]);
      await runner.query(`DELETE FROM jugadores WHERE uid = ?`, [uid]);
      await runner.query('SET FOREIGN_KEY_CHECKS = 1');
      await runner.commitTransaction();
    } catch (err) {
      await runner.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
      await runner.rollbackTransaction();
      throw err;
    } finally {
      await runner.release();
    }
    return { mensaje: `Jugador "${jugador.nombre || jugador.correo}" eliminado.` };
  }
}
