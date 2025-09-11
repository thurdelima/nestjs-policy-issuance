import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RuleType {
  AGE = 'age',
  LOCATION = 'location',
  COVERAGE_AMOUNT = 'coverage_amount',
  RISK_LEVEL = 'risk_level',
  CUSTOMER_SEGMENT = 'customer_segment',
  POLICY_TYPE = 'policy_type',
}

export enum RuleOperator {
  EQUALS = 'equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'not_in',
}

export enum PricingType {
  BASE_PREMIUM = 'base_premium',
  TAX = 'tax',
  FEE = 'fee',
  DISCOUNT = 'discount',
  ADJUSTMENT = 'adjustment',
}

@Entity('pricing_rules')
@Index(['ruleType', 'isActive'])
@Index(['createdAt'])
export class PricingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({
    name: 'rule_type',
    type: 'enum',
    enum: RuleType,
  })
  ruleType: RuleType;

  @Column({
    type: 'enum',
    enum: RuleOperator,
  })
  operator: RuleOperator;

  @Column({ name: 'condition_value', type: 'jsonb' })
  conditionValue: Record<string, any>;

  @Column({
    name: 'adjustment_type',
    type: 'enum',
    enum: PricingType,
  })
  adjustmentType: PricingType;

  @Column({ name: 'adjustment_value', type: 'decimal', precision: 15, scale: 2 })
  adjustmentValue: number;

  @Column({ name: 'adjustment_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  adjustmentPercentage?: number;

  @Column({ name: 'priority', type: 'integer', default: 0 })
  priority: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate: Date;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  isCurrentlyValid(): boolean {
    const now = new Date();
    return now >= this.effectiveDate && (!this.expirationDate || now <= this.expirationDate);
  }

  isApplicable(conditionData: Record<string, any>): boolean {
    if (!this.isActive || !this.isCurrentlyValid()) {
      return false;
    }

    for (const [key, value] of Object.entries(this.conditionValue)) {
      if (conditionData[key] !== value) {
        return false;
      }
    }

    return true;
  }
}
