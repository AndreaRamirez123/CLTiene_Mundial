import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Empresa } from './empresa.entity';

@Entity('trivias_diarias')
@Index('uk_empresa_fecha', ['empresa_id', 'fecha'], { unique: true })
export class TriviaDiaria {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'int' })
  empresa_id: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'json' })
  pregunta_ids: number[];

  @CreateDateColumn()
  created_at: Date;
}
