import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Pricing } from './pricing.entity';

@Entity('pricing_history')
@Index(['pricingId', 'action'])
@Index(['createdAt'])
export class PricingHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pricing_id', type: 'uuid' })
  pricingId: string;

  @ManyToOne(() => Pricing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pricing_id' })
  pricing: Pricing;

  @Column({ name: 'action', type: 'varchar', length: 50 })
  action: string;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues?: Record<string, any>;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues?: Record<string, any>;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy?: string;

  @Column({ name: 'change_reason', type: 'text', nullable: true })
  changeReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  get changeSummary(): string {
    switch (this.action) {
      case 'created':
        return 'Pricing created';
      case 'updated':
        return 'Pricing updated';
      case 'approved':
        return 'Pricing approved';
      case 'rejected':
        return 'Pricing rejected';
      case 'activated':
        return 'Pricing activated';
      case 'deactivated':
        return 'Pricing deactivated';
      case 'calculated':
        return 'Premium calculated';
      case 'rule_applied':
        return 'Pricing rule applied';
      case 'manual_adjustment':
        return 'Manual adjustment made';
      default:
        return 'Unknown action';
    }
  }

  get hasSignificantChange(): boolean {
    if (!this.oldValues || !this.newValues) {
      return false;
    }

    const significantFields = ['basePremium', 'totalPremium', 'discounts', 'adjustments'];
    
    for (const field of significantFields) {
      if (this.oldValues[field] !== this.newValues[field]) {
        return true;
      }
    }

    return false;
  }
}
