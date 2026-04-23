import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('sso_sessions')
export class SsoSession {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  token: string;

  @Index()
  @Column({ type: 'int' })
  jugador_id: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @Column({ type: 'tinyint', default: 0 })
  used: number;
}
