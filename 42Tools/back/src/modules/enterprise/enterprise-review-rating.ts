import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Users } from '../users/users.entity';
import { EnterpriseReview } from './entreprise-review.entity';

@Entity({ name: 'enterprises_review_rating' })
export class EnterpriseReviewRating {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users)
  user: Users;

  @ManyToOne(() => EnterpriseReview)
  enterpriseReview: EnterpriseReview;

  @Column({ type: 'boolean' })
  isUsefull: boolean;
}
