import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CriteriaType {
  INCOME_RATIO = 'income_ratio',
  DEBT_TO_INCOME = 'debt_to_income',
  CREDIT_HISTORY = 'credit_history',
  EMPLOYMENT_STABILITY = 'employment_stability',
  COLLATERAL = 'collateral',
  AGE = 'age',
  LOCATION = 'location',
}

export enum CriteriaOperator {
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  EQUALS = 'eq',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  NOT_IN = 'not_in',
}

@Entity('assessment_criteria')
@Index(['type'])
@Index(['isActive'])
export class AssessmentCriteria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CriteriaType,
  })
  type: CriteriaType;

  @Column({
    type: 'enum',
    enum: CriteriaOperator,
  })
  operator: CriteriaOperator;

  @Column({ type: 'jsonb', name: 'value' })
  value: {
    minValue?: number;
    maxValue?: number;
    allowedValues?: any[];
    excludedValues?: any[];
    customRules?: any;
  };

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  weight: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
