import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Canje } from '../entities/canje.entity';
import { Jugador } from '../entities/jugador.entity';
import { Transaccion } from '../entities/transaccion.entity';
import { WipService } from '../wip/wip.service';

@Injectable()
export class CanjesService {
  private readonly logger = new Logger(CanjesService.name);

  constructor(
    @InjectRepository(Canje)
    private canjeRepo: Repository<Canje>,
    @InjectRepository(Jugador)
    private jugadorRepo: Repository<Jugador>,
    private wip: WipService,
    private dataSource: DataSource,
  ) {}

  // Obtener business units de WIP (para mostrar opciones de canje)
  async getOpcionesCanje() {
    return this.wip.getBusinessUnits();
  }

  // Verificar elegibilidad del jugador
  async verificarElegibilidad(uid: string) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) throw new BadRequestException('Jugador no encontrado');

    const esElegible = jugador.predicciones_count >= 11;

    return {
      elegible: esElegible,
      monedas: jugador.monedas,
      predicciones: jugador.predicciones_count,
      motivo: esElegible
        ? 'Cumples los requisitos para canjear'
        : `Necesitas al menos 11 predicciones (tienes ${jugador.predicciones_count})`,
    };
  }

  // Solicitar canje: descuenta monedas + crea registro local + (opcional) servicio WIP
  async solicitarCanje(
    uid: string,
    datos: {
      beneficio_id: string;
      beneficio_nombre: string;
      monedas_costo: number;
      categoria: string;
      canal_contacto: string;
      // Datos WIP opcionales
      businessUnitId?: string;
      businessUnitName?: string;
      serviceTypeName?: string;
      formId?: string;
      companyFormId?: string;
    },
  ) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) throw new BadRequestException('Jugador no encontrado');

    // Verificar elegibilidad (por predicciones, regla de negocio existente)
    if (jugador.predicciones_count < 11) {
      throw new BadRequestException(
        'No cumples los requisitos minimos para canjear. Necesitas al menos 11 predicciones.',
      );
    }

    // Verificar que tiene suficientes monedas
    if (jugador.monedas < datos.monedas_costo) {
      throw new BadRequestException(
        'No tienes suficientes monedas para este canje',
      );
    }

    // Crear servicio en WIP (opcional, solo si la marca envió los datos)
    let wipServicio: any = null;
    if (datos.businessUnitId && datos.formId) {
      try {
        wipServicio = await this.wip.crearServicio({
          businessUnitId: datos.businessUnitId,
          businessUnitName: datos.businessUnitName || '',
          serviceTypeName: datos.serviceTypeName || '',
          formId: datos.formId,
          companyFormId: datos.companyFormId || '',
          finalClientName: jugador.nombre,
          customerDocument: jugador.uid,
          userClientePhone: jugador.telefono,
          note: `Canje Polla CLTiene Mundial 2026 - ${datos.monedas_costo} monedas - ${datos.beneficio_nombre}`,
          fields: {
            'Nombre jugador': jugador.nombre,
            Email: jugador.email,
            'Monedas canjeadas': String(datos.monedas_costo),
            Beneficio: datos.beneficio_nombre,
            'Canal de contacto': datos.canal_contacto,
            'Ranking monedas': String(jugador.monedas),
            'Predicciones realizadas': String(jugador.predicciones_count),
            Nivel: jugador.nivel,
          },
        });
        this.logger.log(`Servicio WIP creado para jugador ${uid}`);
      } catch (err: any) {
        this.logger.error(
          `Error creando servicio WIP para jugador ${uid}`,
          err?.message,
        );
        // Continuar aunque WIP falle - el canje se registra localmente
      }
    }

    // Transacción atómica: descontar monedas + registrar transacción + crear canje
    let canjeId = 0;
    await this.dataSource.transaction(async (manager) => {
      const jug = await manager.findOne(Jugador, { where: { uid } });
      if (!jug) throw new BadRequestException('Jugador no encontrado');

      // Re-verificar saldo dentro de la transacción (race condition)
      if (jug.monedas < datos.monedas_costo) {
        throw new BadRequestException(
          'No tienes suficientes monedas para este canje',
        );
      }

      const saldoAnterior = jug.monedas;
      const saldoNuevo = saldoAnterior - datos.monedas_costo;

      // Registrar transacción de descuento (monto negativo)
      await manager.save(Transaccion, {
        jugador_id: jug.id,
        tipo: 'canje',
        monto: -datos.monedas_costo,
        saldo_anterior: saldoAnterior,
        saldo_nuevo: saldoNuevo,
        descripcion: `Canje: ${datos.beneficio_nombre}`,
      });

      // Descontar monedas
      jug.monedas = saldoNuevo;
      jug.canal_contacto = datos.canal_contacto as any;
      jug.elegible_canje = 1;
      await manager.save(Jugador, jug);

      // Guardar canje
      const canje = manager.create(Canje, {
        jugador_id: jug.id,
        monedas_canjeadas: datos.monedas_costo,
        beneficio: datos.beneficio_nombre,
        categoria: datos.categoria as any,
        canal_contacto: datos.canal_contacto as any,
        estado: 'solicitado',
        notas_asesor: wipServicio?.id
          ? `WIP Service ID: ${wipServicio.id}`
          : 'Pendiente creacion en WIP',
      });
      const canjeSaved = await manager.save(canje);
      canjeId = canjeSaved.id;
    });

    return {
      mensaje:
        'Solicitud de canje registrada. Un asesor se pondra en contacto contigo.',
      canje_id: canjeId,
      wip_service_id: wipServicio?.id || null,
    };
  }

  // Obtener canjes del jugador
  async getCanjesJugador(uid: string) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) return [];

    return this.canjeRepo.find({
      where: { jugador_id: jugador.id },
      order: { created_at: 'DESC' },
    });
  }

  // Webhook: WIP notifica actualizacion de estado del servicio
  async webhookActualizacion(datos: {
    id: string;
    status: string;
    finalClientName: string;
    customerDocument: string;
  }) {
    // Buscar el canje que tiene este WIP service ID
    const canje = await this.canjeRepo
      .createQueryBuilder('c')
      .where('c.notas_asesor LIKE :wipId', { wipId: `%${datos.id}%` })
      .getOne();

    if (!canje) {
      this.logger.warn(
        `Webhook WIP: no se encontro canje para servicio ${datos.id}`,
      );
      return { response: true };
    }

    // Mapear estados WIP → estados internos
    const statusMap: Record<string, string> = {
      Pending: 'solicitado',
      InProgress: 'en_contacto',
      Finished: 'entregado',
      Cancelled: 'cancelado',
    };

    const nuevoEstado = statusMap[datos.status] || canje.estado;
    await this.canjeRepo.update(canje.id, { estado: nuevoEstado as any });

    this.logger.log(
      `Canje ${canje.id} actualizado a ${nuevoEstado} por webhook WIP`,
    );
    return { response: true };
  }
}
