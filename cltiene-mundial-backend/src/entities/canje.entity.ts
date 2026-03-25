import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Jugador } from './jugador.entity';

@Entity('canjes')
export class Canje {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  jugador_id: number;

  @Column({ type: 'int', unsigned: true })
  monedas_canjeadas: number;

  @Column({ type: 'varchar', length: 255 })
  beneficio: string;

  @Column({
    type: 'enum',
    enum: ['descuento', 'plan_especial', 'consultoria', 'premio'],
  })
  categoria: string;

  @Column({
    type: 'enum',
    enum: ['solicitado', 'en_contacto', 'entregado', 'cancelado'],
    default: 'solicitado',
  })
  estado: string;

  @Column({ type: 'enum', enum: ['whatsapp', 'email', 'telefono'] })
  canal_contacto: string;

  @Column({ type: 'text', nullable: true })
  notas_asesor: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relaciones
  @ManyToOne(() => Jugador, (j) => j.canjes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jugador_id' })
  jugador: Jugador;
}
