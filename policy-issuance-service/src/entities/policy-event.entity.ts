import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Policy } from './policy.entity';

export enum EventType {
  POLICY_CREATED = 'policy_created',
  POLICY_UPDATED = 'policy_updated',
  CREDIT_ASSESSMENT_REQUESTED = 'credit_assessment_requested',
  CREDIT_ASSESSMENT_COMPLETED = 'credit_assessment_completed',
  PRICING_REQUESTED = 'pricing_requested',
  PRICING_COMPLETED = 'pricing_completed',
  PAYMENT_PROCESSED = 'payment_processed',
  POLICY_ACTIVATED = 'policy_activated',
  POLICY_CANCELLED = 'policy_cancelled',
  POLICY_SUSPENDED = 'policy_suspended',
  POLICY_EXPIRED = 'policy_expired',
}

export enum EventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('policy_events')
@Index(['policyId'])
@Index(['eventType'])
@Index(['status'])
@Index(['createdAt'])
export class PolicyEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'policy_id' })
  policyId: string;

  @Column({
    type: 'enum',
    enum: EventType,
    name: 'event_type'
  })
  eventType: EventType;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PENDING,
  })
  status: EventStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => Policy, (policy) => policy.id)
  @JoinColumn({ name: 'policy_id' })
  policy: Policy;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
