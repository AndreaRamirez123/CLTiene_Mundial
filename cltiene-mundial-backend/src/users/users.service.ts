import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Jugador } from '../entities/jugador.entity';
import { Transaccion } from '../entities/transaccion.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Jugador)
    private jugadorRepo: Repository<Jugador>,
    private dataSource: DataSource,
  ) {}

  async getByUid(uid: string): Promise<Jugador | null> {
    return this.jugadorRepo.findOne({ where: { uid } });
  }

  async registrar(datos: {
    uid: string;
    email: string;
    nombre: string;
    telefono: string;
    correo: string;
    tipojugador: string;
    relacion_cltiene: string;
    es_referido: number;
    nombre_referidor: string;
    referido_por: string;
  }) {
    const existe = await this.jugadorRepo.findOne({ where: { uid: datos.uid } });
    if (existe) {
      throw new BadRequestException('El jugador ya está registrado');
    }

    const codigoReferido = datos.uid.substring(0, 8).toUpperCase();
    const bonoRegistro = 100;

    return this.dataSource.transaction(async (manager) => {
      const jugador = manager.create(Jugador, {
        uid: datos.uid,
        email: datos.email,
        nombre: datos.nombre,
        telefono: datos.telefono,
        correo: datos.correo,
        tipojugador: datos.tipojugador || null,
        relacion_cltiene: datos.relacion_cltiene || null,
        es_referido: datos.es_referido,
        nombre_referidor: datos.nombre_referidor,
        codigo_referido: codigoReferido,
        referido_por: datos.referido_por,
        monedas: bonoRegistro,
        monedas_totales_ganadas: bonoRegistro,
        nivel: 'activo',
      });

      const saved = await manager.save(jugador);

      await manager.save(Transaccion, {
        jugador_id: saved.id,
        tipo: 'registro',
        monto: bonoRegistro,
        saldo_anterior: 0,
        saldo_nuevo: bonoRegistro,
        descripcion: 'Bono de bienvenida por registro',
      });

      return saved;
    });
  }
}
