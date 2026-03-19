import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Canje } from '../entities/canje.entity';
import { Jugador } from '../entities/jugador.entity';
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

  // Solicitar canje: crea registro local + servicio en WIP
  async solicitarCanje(uid: string, datos: {
    beneficio: string;
    categoria: string;
    canal_contacto: string;
    monedas_a_canjear: number;
    // Datos WIP
    businessUnitId: string;
    businessUnitName: string;
    serviceTypeName: string;
    formId: string;
    companyFormId: string;
  }) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) throw new BadRequestException('Jugador no encontrado');

    // Verificar elegibilidad
    if (jugador.predicciones_count < 11) {
      throw new BadRequestException(
        'No cumples los requisitos minimos para canjear. Necesitas al menos 11 predicciones.',
      );
    }

    // Verificar que tiene suficientes monedas
    if (jugador.monedas < datos.monedas_a_canjear) {
      throw new BadRequestException('No tienes suficientes monedas para este canje');
    }

    // Crear servicio en WIP
    let wipServicio: any = null;
    try {
      wipServicio = await this.wip.crearServicio({
        businessUnitId: datos.businessUnitId,
        businessUnitName: datos.businessUnitName,
        serviceTypeName: datos.serviceTypeName,
        formId: datos.formId,
        companyFormId: datos.companyFormId,
        finalClientName: jugador.nombre,
        customerDocument: jugador.uid,
        userClientePhone: jugador.telefono,
        note: `Canje Polla CLTiene Mundial 2026 - ${datos.monedas_a_canjear} monedas - ${datos.beneficio}`,
        fields: {
          'Nombre jugador': jugador.nombre,
          'Email': jugador.email,
          'Monedas canjeadas': String(datos.monedas_a_canjear),
          'Beneficio': datos.beneficio,
          'Canal de contacto': datos.canal_contacto,
          'Ranking monedas': String(jugador.monedas),
          'Predicciones realizadas': String(jugador.predicciones_count),
          'Nivel': jugador.nivel,
        },
      });
      this.logger.log(`Servicio WIP creado para jugador ${uid}`);
    } catch (err) {
      this.logger.error(`Error creando servicio WIP para jugador ${uid}`, err.message);
      // Continuar aunque WIP falle - el canje se registra localmente
    }

    // Guardar canje en MySQL
    const canje = this.canjeRepo.create({
      jugador_id: jugador.id,
      monedas_canjeadas: datos.monedas_a_canjear,
      beneficio: datos.beneficio,
      categoria: datos.categoria as any,
      canal_contacto: datos.canal_contacto as any,
      estado: 'solicitado',
      notas_asesor: wipServicio?.id
        ? `WIP Service ID: ${wipServicio.id}`
        : 'Pendiente creacion en WIP',
    });

    await this.canjeRepo.save(canje);

    // Actualizar canal de contacto del jugador
    await this.jugadorRepo.update(jugador.id, {
      canal_contacto: datos.canal_contacto as any,
      elegible_canje: 1,
    });

    return {
      mensaje: 'Solicitud de canje registrada. Un asesor CLTiene se pondra en contacto contigo.',
      canje_id: canje.id,
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
      this.logger.warn(`Webhook WIP: no se encontro canje para servicio ${datos.id}`);
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

    this.logger.log(`Canje ${canje.id} actualizado a ${nuevoEstado} por webhook WIP`);
    return { response: true };
  }
}
