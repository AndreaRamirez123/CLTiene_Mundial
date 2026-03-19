import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { Prediccion } from './prediccion.entity';
import { Transaccion } from './transaccion.entity';
import { TriviaHistorial } from './trivia-historial.entity';
import { Canje } from './canje.entity';

@Entity('jugadores')
export class Jugador {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128, unique: true })
  uid: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 150, default: '' })
  nombre: string;

  @Column({ type: 'varchar', length: 30, default: '' })
  telefono: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  correo: string;

  // Encuesta de registro
  @Column({ type: 'enum', enum: ['natural', 'empresa', 'organizacion', 'explorar'], nullable: true })
  tipojugador: string | null;

  @Column({ type: 'enum', enum: ['cliente', 'escuchado', 'explorando', 'nuevo'], nullable: true })
  relacion_cltiene: string | null;

  @Column({ type: 'tinyint', default: 0 })
  es_referido: number;

  @Column({ type: 'varchar', length: 150, default: '' })
  nombre_referidor: string;

  // Sistema de monedas (NUNCA baja)
  @Index()
  @Column({ type: 'int', unsigned: true, default: 0 })
  monedas: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  monedas_totales_ganadas: number;

  // Sistema de goles (misiones)
  @Column({ type: 'int', unsigned: true, default: 0 })
  goles: number;

  // Progreso
  @Column({ type: 'int', unsigned: true, default: 0 })
  predicciones_count: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  predicciones_acertadas: number;

  @Column({ type: 'enum', enum: ['inactivo', 'activo', 'muy_activo'], default: 'activo' })
  nivel: string;

  // Referidos
  @Index()
  @Column({ type: 'varchar', length: 10 })
  codigo_referido: string;

  @Index()
  @Column({ type: 'varchar', length: 10, default: '' })
  referido_por: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  referidos_count: number;

  // Misiones completadas
  @Column({ type: 'json', nullable: true })
  misiones_completadas: string[];

  // Trivia
  @Column({ type: 'int', unsigned: true, default: 0 })
  trivias_jugadas: number;

  @Column({ type: 'date', nullable: true })
  ultimo_trivia: string | null;

  // Bonos
  @Column({ type: 'date', nullable: true })
  ultimo_bono_diario: string | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  dias_consecutivos: number;

  @Column({ type: 'datetime', nullable: true })
  ultimo_acceso: Date | null;

  // Notificaciones
  @Column({ type: 'varchar', length: 500, nullable: true })
  fcm_token: string | null;

  // Canje
  @Column({ type: 'enum', enum: ['whatsapp', 'email', 'telefono'], nullable: true })
  canal_contacto: string | null;

  @Column({ type: 'tinyint', default: 0 })
  elegible_canje: number;

  // Metadata
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relaciones
  @OneToMany(() => Prediccion, (p) => p.jugador)
  predicciones: Prediccion[];

  @OneToMany(() => Transaccion, (t) => t.jugador)
  transacciones: Transaccion[];

  @OneToMany(() => TriviaHistorial, (t) => t.jugador)
  trivias: TriviaHistorial[];

  @OneToMany(() => Canje, (c) => c.jugador)
  canjes: Canje[];
}
