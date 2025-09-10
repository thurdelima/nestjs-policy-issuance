import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PricingStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum PricingType {
  BASE_PREMIUM = 'base_premium',
  TAX = 'tax',
  FEE = 'fee',
  DISCOUNT = 'discount',
  ADJUSTMENT = 'adjustment',
}

@Entity('pricings')
@Index(['policyId', 'status'])
@Index(['createdAt'])
export class Pricing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'policy_id', type: 'uuid' })
  policyId: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'policy_number', type: 'varchar', length: 50 })
  policyNumber: string;

  @Column({
    type: 'enum',
    enum: PricingStatus,
    default: PricingStatus.DRAFT,
  })
  status: PricingStatus;

  @Column({ name: 'base_premium', type: 'decimal', precision: 15, scale: 2 })
  basePremium: number;

  @Column({ name: 'taxes', type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxes: number;

  @Column({ name: 'fees', type: 'decimal', precision: 15, scale: 2, default: 0 })
  fees: number;

  @Column({ name: 'discounts', type: 'decimal', precision: 15, scale: 2, default: 0 })
  discounts: number;

  @Column({ name: 'adjustments', type: 'decimal', precision: 15, scale: 2, default: 0 })
  adjustments: number;

  @Column({ name: 'total_premium', type: 'decimal', precision: 15, scale: 2 })
  totalPremium: number;

  @Column({ name: 'coverage_amount', type: 'decimal', precision: 15, scale: 2 })
  coverageAmount: number;

  @Column({ name: 'premium_rate', type: 'decimal', precision: 8, scale: 4, nullable: true })
  premiumRate?: number;

  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate: Date;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate?: Date;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ name: 'approved_at', type: 'timestamp with time zone', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'pricing_details', type: 'jsonb', nullable: true })
  pricingDetails?: Record<string, any>;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  get netPremium(): number {
    return this.basePremium + this.taxes + this.fees - this.discounts + this.adjustments;
  }

  get premiumRateCalculated(): number {
    if (this.coverageAmount > 0) {
      return (this.totalPremium / this.coverageAmount) * 100;
    }
    return 0;
  }
}
