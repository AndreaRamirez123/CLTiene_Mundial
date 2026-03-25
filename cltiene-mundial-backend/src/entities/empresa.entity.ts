import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { Jugador } from './jugador.entity';
import { Partido } from './partido.entity';
import { ConfigMarca } from './config-marca.entity';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Index()
  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: ['activa', 'inactiva'],
    default: 'activa',
  })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relaciones
  @OneToMany(() => Jugador, (j) => j.empresa)
  jugadores: Jugador[];

  @OneToMany(() => Partido, (p) => p.empresa)
  partidos: Partido[];

  @OneToOne(() => ConfigMarca, (c) => c.empresa)
  configMarca: ConfigMarca;
}
