import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigMarca } from '../entities/config-marca.entity';
import { Empresa } from '../entities/empresa.entity';

@Injectable()
export class ConfigMarcaService {
  constructor(
    @InjectRepository(ConfigMarca)
    private configRepo: Repository<ConfigMarca>,
    @InjectRepository(Empresa)
    private empresaRepo: Repository<Empresa>,
  ) {}

  async obtenerConfigPorEmpresa(empresaId: number) {
    const config = await this.configRepo.findOne({
      where: { empresa_id: empresaId },
    });
    if (!config) {
      throw new NotFoundException(
        'Configuración de marca no encontrada para esta empresa.',
      );
    }
    return config;
  }

  async actualizarConfigPorEmpresa(
    empresaId: number,
    data: Partial<ConfigMarca>,
  ) {
    const config = await this.configRepo.findOne({
      where: { empresa_id: empresaId },
    });
    if (!config) {
      throw new NotFoundException(
        'Configuración de marca no encontrada para esta empresa.',
      );
    }

    Object.assign(config, data);
    const saved = await this.configRepo.save(config);

    // Sincronizar nombre de empresa si cambio nombre_app
    if (data.nombre_app) {
      await this.empresaRepo.update(empresaId, { nombre: data.nombre_app });
    }

    return saved;
  }
}
