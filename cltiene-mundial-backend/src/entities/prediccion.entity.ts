import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique, Index,
} from 'typeorm';
import { Jugador } from './jugador.entity';
import { Partido } from './partido.entity';

@Entity('predicciones')
@Unique(['jugador', 'partido'])
export class Prediccion {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  jugador_id: number;

  @Column()
  partido_id: number;

  @Column({ type: 'enum', enum: ['local', 'visitante', 'empate'] })
  resultado: string;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  goles_local: number;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  goles_visitante: number;

  @Column({
    type: 'enum',
    enum: ['pendiente', 'acertada_simple', 'acertada_especial', 'fallida'],
    default: 'pendiente',
  })
  estado: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  monedas_ganadas: number;

  @CreateDateColumn()
  created_at: Date;

  // Relaciones
  @ManyToOne(() => Jugador, (j) => j.predicciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jugador_id' })
  jugador: Jugador;

  @ManyToOne(() => Partido, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partido_id' })
  partido: Partido;
}
