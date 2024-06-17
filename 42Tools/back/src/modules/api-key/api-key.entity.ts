import 'reflect-metadata';
import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({})
export class ApiKeys {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column()
  clientId: string;

  @Column()
  clientSecret: string;

  @Column({ nullable: true, type: 'text' })
  token: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  tokenValidUntil: number | Date | string;

  @Column({ default: 1200 })
  totalRequestCount: number;

  @Column({ default: 0 })
  currentUsage: number;

  @Column({ default: () => 'NOW()', type: 'timestamp' })
  lastUsedAt: number | Date | string;

  @Column({ default: false })
  hasError: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  intraRenewSecretAt?: number | Date | string;
}
