import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('partidos')
export class Partido {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 5, nullable: true })
  grupo: string | null;

  @Column({ type: 'varchar', length: 100 })
  local_equipo: string;

  @Column({ type: 'varchar', length: 100 })
  visitante_equipo: string;

  @Column({ type: 'varchar', length: 10 })
  bandera_local: string;

  @Column({ type: 'varchar', length: 10 })
  bandera_visitante: string;

  @Index()
  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'varchar', length: 10 })
  hora: string;

  @Column({
    type: 'enum',
    enum: ['Grupos', 'Dieciseisavos', 'Octavos', 'Cuartos', 'Semifinales', 'Tercer puesto', 'Final'],
  })
  fase: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ['pendiente', 'en_curso', 'finalizado'],
    default: 'pendiente',
  })
  estado: string;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  goles_local: number | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  goles_visitante: number | null;

  @Column({ type: 'enum', enum: ['local', 'visitante', 'empate'], nullable: true })
  resultado: string | null;

  @CreateDateColumn()
  created_at: Date;
}
