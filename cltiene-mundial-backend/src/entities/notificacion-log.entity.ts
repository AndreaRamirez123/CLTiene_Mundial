import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Jugador } from './jugador.entity';

@Entity('notificaciones_log')
export class NotificacionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  jugador_id: number;

  @Column({
    type: 'enum',
    enum: ['previa_fecha', 'recordatorio_pendiente', 'inactividad'],
  })
  tipo: string;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'tinyint', default: 0 })
  enviada: number;

  @CreateDateColumn()
  created_at: Date;

  // Relaciones
  @ManyToOne(() => Jugador, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jugador_id' })
  jugador: Jugador;
}
