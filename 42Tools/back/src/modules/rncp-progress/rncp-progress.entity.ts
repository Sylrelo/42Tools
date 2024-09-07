import 'reflect-metadata';
import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Users } from '../users/users.entity';
import { RncpDefinition } from '../rncp-definition/rncp-definition.entity';

@Entity({})
export class CachedRncpProgress {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => Users)
  user: Users;

  @ManyToOne(() => RncpDefinition, {
    onDelete: 'CASCADE',
  })
  rncp: RncpDefinition;

  @Column({ default: 0, type: 'float' })
  proExpProgress: number;

  // @Column({ default: 0, type: "float" })
  // projectXpProgress: number

  // @Column({ default: 0, type: "float" })
  // projectCountProgress: number

  @Column({ default: 0, type: 'float' })
  levelProgress: number;

  @Column({ default: 0, type: 'float' })
  eventProgress: number;

  @Column({ default: 0, type: 'float' })
  totalProgress: number;

  // Only for RNCP Search page
  blocksProgress: number[];
}