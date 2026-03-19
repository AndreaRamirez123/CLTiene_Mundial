import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class WipService {
  private readonly client: AxiosInstance;
  private readonly logger = new Logger(WipService.name);

  // IDs de configuracion
  readonly userId: string;
  readonly ownerId: string;
  readonly buOwnerId: string;
  readonly companyId: string;
  readonly ownerName: string;
  readonly buOwnerName: string;

  constructor(private config: ConfigService) {
    const baseURL = config.get('WIP_BASE_URL', 'https://api.wiptool.com');
    const apiKey = config.get('WIP_API_KEY', '');

    this.userId = config.get('WIP_USER_ID', '');
    this.ownerId = config.get('WIP_OWNER_ID', '');
    this.buOwnerId = config.get('WIP_BU_OWNER_ID', '');
    this.companyId = config.get('WIP_COMPANY_ID', '');
    this.ownerName = config.get('WIP_OWNER_NAME', '');
    this.buOwnerName = config.get('WIP_BU_OWNER_NAME', '');

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  // =============================================
  // 4. Buscar unidades de negocio y tipos de servicio
  // =============================================
  async getBusinessUnits() {
    try {
      const res = await this.client.get(
        `/business/api/v1/BusinessUnit/company/${this.companyId}/business-units/services`,
      );
      return res.data;
    } catch (err) {
      this.logger.error('Error obteniendo business units de WIP', err.message);
      throw err;
    }
  }

  // =============================================
  // 5. Crear un servicio en WIP
  // =============================================
  async crearServicio(datos: {
    businessUnitId: string;
    businessUnitName: string;
    serviceTypeName: string;
    formId: string;
    companyFormId: string;
    finalClientName: string;
    customerDocument: string;
    userClientePhone: string;
    note: string;
    fields?: Record<string, string>;
  }) {
    try {
      const body = {
        owner: {
          id: this.ownerId,
          name: this.ownerName,
          type: 'Owner',
        },
        expedient: '',
        userName: datos.finalClientName,
        userPhone: datos.userClientePhone,
        businessUnitId: datos.businessUnitId,
        businessUnitName: datos.businessUnitName,
        plate: '',
        finalClientName: datos.finalClientName,
        whereTo: {
          address: '',
          otherInfo: '',
          city: '',
        },
        fromWhere: {
          address: '',
          otherInfo: '',
          city: '',
        },
        userClientePhone: datos.userClientePhone,
        customerDocument: datos.customerDocument,
        scheduledDate: new Date().toISOString(),
        type: datos.serviceTypeName,
        note: datos.note,
        customerId: null,
        automaticCalculation: true,
        fields: datos.fields || {},
        formId: datos.formId,
        companyFormId: datos.companyFormId,
        creatorUser: {
          id: this.userId,
          name: this.ownerName,
        },
        buOwner: {
          id: this.buOwnerId,
          name: this.buOwnerName,
          type: 'BuOwner',
        },
      };

      const res = await this.client.post(
        `/service/api/v2/Service/${this.companyId}/service/${this.userId}`,
        body,
      );
      return res.data;
    } catch (err) {
      this.logger.error('Error creando servicio en WIP', err.message);
      throw err;
    }
  }

  // =============================================
  // 6. Buscar servicio por ID
  // =============================================
  async getServicio(serviceId: string) {
    try {
      const res = await this.client.get(
        `/service/api/v1/Service/${serviceId}`,
      );
      return res.data;
    } catch (err) {
      this.logger.error('Error buscando servicio en WIP', err.message);
      throw err;
    }
  }

  // =============================================
  // 7. Buscar servicios por documento/nombre/telefono
  // =============================================
  async buscarServicios(busqueda: {
    subject: string;
    businessUnitId?: string;
    page?: number;
    pageSize?: number;
  }) {
    try {
      const res = await this.client.post(
        '/service/api/v1/Service/search',
        {
          pageSize: busqueda.pageSize || 10,
          page: busqueda.page || 0,
          sort: 'scheduledDate',
          sortDirection: 'Desc',
          businessUnitId: busqueda.businessUnitId || '',
          companyId: this.companyId,
          userId: this.userId,
          subject: busqueda.subject,
        },
      );
      return res.data;
    } catch (err) {
      this.logger.error('Error buscando servicios en WIP', err.message);
      throw err;
    }
  }

  // =============================================
  // 8. Buscar suscripciones por documento o placa
  // =============================================
  async buscarSuscripcion(businessUnitId: string, searchTerm: string) {
    try {
      const res = await this.client.get(
        `/Customer/api/v1/Customer/Subscription`,
        {
          params: {
            companyId: this.companyId,
            businessUnitId,
            searchTerm,
          },
        },
      );
      return res.data;
    } catch (err) {
      this.logger.error('Error buscando suscripcion en WIP', err.message);
      throw err;
    }
  }

  // =============================================
  // 9. Detalle de suscripcion
  // =============================================
  async detalleSuscripcion(customerId: string, businessUnitId: string) {
    try {
      const res = await this.client.post(
        '/Customer/api/v1/Customer/Subscription/Consumption',
        {
          customerId,
          businessUnitId,
          timeZone: 'America/Bogota',
          companyId: this.companyId,
        },
      );
      return res.data;
    } catch (err) {
      this.logger.error('Error obteniendo detalle de suscripcion en WIP', err.message);
      throw err;
    }
  }
}
