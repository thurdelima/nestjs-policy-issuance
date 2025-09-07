import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AssessmentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum AssessmentResult {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PENDING_ADDITIONAL_INFO = 'pending_additional_info',
}

@Entity('credit_assessments')
@Index(['policyId'], { unique: true })
@Index(['customerId'])
@Index(['status'])
@Index(['createdAt'])
export class CreditAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'policy_id' })
  policyId: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ length: 20, name: 'policy_number' })
  policyNumber: string;

  @Column({
    type: 'enum',
    enum: AssessmentStatus,
    default: AssessmentStatus.PENDING,
  })
  status: AssessmentStatus;

  @Column({
    type: 'enum',
    enum: AssessmentResult,
    nullable: true,
  })
  result: AssessmentResult;

  @Column({ type: 'int', nullable: true, name: 'credit_score' })
  creditScore: number;

  @Column({
    type: 'enum',
    enum: RiskLevel,
    nullable: true,
    name: 'risk_level'
  })
  riskLevel: RiskLevel;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'requested_amount' })
  requestedAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'approved_amount' })
  approvedAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'interest_rate' })
  interestRate: number;

  @Column({ type: 'int', nullable: true, name: 'term_months' })
  termMonths: number;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string;

  @Column({ type: 'jsonb', nullable: true, name: 'external_data' })
  externalData: {
    serasaScore?: number;
    spcStatus?: string;
    bankRelationship?: any;
    previousLoans?: any[];
  };

  @Column({ type: 'jsonb', nullable: true, name: 'assessment_criteria' })
  assessmentCriteria: {
    incomeRatio: number;
    debtToIncomeRatio: number;
    creditHistoryScore: number;
    employmentStability: number;
    collateralValue?: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
