import {
  Collection,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../users/users.entity';
import { Enterprise } from './enterprise.entity';
import { EnterpriseReviewRating } from './enterprise-review-rating';

@Entity({ name: 'entreprises_review' })
export class EnterpriseReview {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Enterprise)
  enterprise: Enterprise;

  @ManyToOne(() => Users)
  user: Users;

  @Column({ nullable: false })
  comment: string;

  @Column({ type: 'float', default: 2.5 })
  rating: number;

  @Column()
  contractType: string; // enum

  @Column()
  contractDuration: number;

  @Column({ nullable: true })
  contractStartDate?: number;

  @Column({ type: 'boolean', default: true })
  isAnon: boolean;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  createdAt: number | Date | string;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  updatedAt: number | Date | string;

  @OneToMany(() => EnterpriseReviewRating, (err) => err.enterpriseReview)
  usefullness: EnterpriseReviewRating[];
}
