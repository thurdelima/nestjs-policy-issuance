import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

export enum   PolicyType {
  FIANCA = 'fianca',
  CAPITALIZACAO = 'capitalizacao',
}

export enum PolicyStatus {
  DRAFT = 'draft',
  PENDING_CREDIT_ASSESSMENT = 'pending_credit_assessment',
  PENDING_PRICING = 'pending_pricing',
  PENDING_PAYMENT = 'pending_payment',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('policies')
@Index(['policyNumber'], { unique: true })
@Index(['customerId'])
@Index(['agentId'])
@Index(['status'])
@Index(['createdAt'])
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true, name: 'policy_number' })
  policyNumber: string;

  @Column({
    type: 'enum',
    enum: PolicyType,
  })
  type: PolicyType;

  @Column({
    type: 'enum',
    enum: PolicyStatus,
    default: PolicyStatus.DRAFT,
  })
  status: PolicyStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'premium_amount' })
  premiumAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'coverage_amount' })
  coverageAmount: number;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'date', nullable: true, name: 'effective_date' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true, name: 'cancellation_date' })
  cancellationDate: Date;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    name: 'payment_status'
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'date', nullable: true, name: 'payment_due_date' })
  paymentDueDate: Date;

  @Column({ type: 'date', nullable: true, name: 'payment_date' })
  paymentDate: Date;

  @Column({ type: 'jsonb', name: 'coverage_details' })
  coverageDetails: {
    description: string;
    terms: string[];
    exclusions: string[];
    conditions: string[];
  };

  @Column({ type: 'jsonb', nullable: true, name: 'pricing_details' })
  pricingDetails: {
    basePremium: number;
    taxes: number;
    fees: number;
    discounts: number;
    totalPremium: number;
    currency: string;
  };

  @Column({ type: 'jsonb', nullable: true, name: 'credit_assessment' })
  creditAssessment: {
    score: number;
    status: string;
    details: Record<string, any>;
    assessedAt: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'uuid', nullable: true, name: 'agent_id' })
  agentId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
