import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique, Index,
} from 'typeorm';
import { Jugador } from './jugador.entity';

@Entity('trivias_historial')
@Unique(['jugador', 'fecha'])
export class TriviaHistorial {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  jugador_id: number;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  correctas: number;

  @Column({ type: 'tinyint', unsigned: true, default: 5 })
  total_preguntas: number;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  goles_ganados: number;

  @Column({ type: 'tinyint', default: 0 })
  primera_vez: number;

  @Column({ type: 'date' })
  fecha: string;

  @CreateDateColumn()
  created_at: Date;

  // Relaciones
  @ManyToOne(() => Jugador, (j) => j.trivias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jugador_id' })
  jugador: Jugador;
}
