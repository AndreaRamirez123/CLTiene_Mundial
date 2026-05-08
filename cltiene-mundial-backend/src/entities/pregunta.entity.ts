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

@Entity('preguntas')
@Index('idx_empresa_tipo', ['empresa_id', 'tipo'])
export class Pregunta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  pregunta: string;

  // JSON array de strings: ["opción1", "opción2", "opción3", "opción4"]
  @Column({ type: 'json' })
  opciones: string[];

  // Índice de la respuesta correcta (0-3)
  @Column({ type: 'tinyint' })
  correcta: number;

  // null = pregunta global (todos la ven), con valor = solo esa empresa
  @ManyToOne(() => Empresa, { nullable: true })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'int', nullable: true })
  empresa_id: number | null;

  // mundial = sobre fútbol, empresa = sobre la empresa
  @Column({
    type: 'enum',
    enum: ['mundial', 'empresa'],
    default: 'mundial',
  })
  tipo: string;

  // Si se quiere asignar a un día específico (0=dom, 1=lun, ..., 6=sab), null = cualquier día
  @Column({ type: 'tinyint', nullable: true })
  dia_semana: number | null;

  @Column({ type: 'tinyint', default: 1 })
  activa: number;

  @Column({ type: 'date', nullable: true })
  ultima_usada: string | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  veces_usada: number;

  @CreateDateColumn()
  created_at: Date;
}
