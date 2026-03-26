import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from './empresa.entity';

@Entity('config_marca')
export class ConfigMarca {
  @PrimaryGeneratedColumn()
  id: number;

  // Empresa (tenant) - relación 1:1
  @OneToOne(() => Empresa, (e) => e.configMarca)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'int', unique: true })
  empresa_id: number;

  @Column({ type: 'varchar', length: 150, default: 'CLTiene Mundial' })
  nombre_app: string;

  @Column({ type: 'varchar', length: 150, default: 'Mundial 2026' })
  subtitulo: string;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  // Paleta de colores
  @Column({ type: 'varchar', length: 10, default: '#FD7751' })
  color_primario: string;

  @Column({ type: 'varchar', length: 10, default: '#ED1E28' })
  color_secundario: string;

  @Column({ type: 'varchar', length: 10, default: '#ECA82D' })
  color_acento: string;

  @Column({ type: 'varchar', length: 10, default: '#0f0a1e' })
  color_fondo: string;

  // Textos legales editables por empresa
  @Column({ type: 'longtext', nullable: true })
  terminos_condiciones: string;

  @Column({ type: 'longtext', nullable: true })
  politica_privacidad: string;

  @UpdateDateColumn()
  updated_at: Date;
}
