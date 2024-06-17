import {
  Collection,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../users/users.entity';
import { EnterpriseReview } from './entreprise-review.entity';

@Entity({ name: 'entreprises' })
export class Enterprise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'boolean' })
  isSponsor: boolean;

  @Column({ type: 'timestamp' })
  createdAt: string | number | Date;

  @Column({ type: 'timestamp' })
  updatedAt: string | number | Date;

  @ManyToOne(() => Users)
  createdBy: Users;

  @OneToMany(() => EnterpriseReview, (er) => er.enterprise)
  reviews: EnterpriseReview[];
}
