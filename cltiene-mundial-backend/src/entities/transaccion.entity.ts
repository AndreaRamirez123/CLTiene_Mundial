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

@Entity('transacciones')
export class Transaccion {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  jugador_id: number;

  @Column({
    type: 'enum',
    enum: [
      'registro',
      'bono_diario',
      'bono_apuesta',
      'prediccion_simple',
      'prediccion_especial',
      'bono_referido',
      'trivia',
    ],
  })
  tipo: string;

  @Column({ type: 'int', unsigned: true })
  monto: number;

  @Column({ type: 'int', unsigned: true })
  saldo_anterior: number;

  @Column({ type: 'int', unsigned: true })
  saldo_nuevo: number;

  @Column({ type: 'varchar', length: 255, default: '' })
  descripcion: string;

  @Column({ type: 'int', nullable: true })
  referencia_id: number | null;

  @CreateDateColumn()
  created_at: Date;

  // Relaciones
  @ManyToOne(() => Jugador, (j) => j.transacciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jugador_id' })
  jugador: Jugador;
}
