import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pricing } from '../../../entities/pricing.entity';
import { PricingRule, RuleType, PricingType } from '../../../entities/pricing-rule.entity';
import { RedisService } from '../../../shared/redis/redis.service';

@Injectable()
export class PricingCalculationService {
  private readonly logger = new Logger(PricingCalculationService.name);

  constructor(
    @InjectRepository(PricingRule)
    private pricingRuleRepository: Repository<PricingRule>,
    private redisService: RedisService,
  ) {}

  async calculateFinalPremium(
    pricing: Pricing,
    metadata: Record<string, any> = {},
  ): Promise<Pricing> {
    try {
      const applicableRules = await this.getApplicableRules(pricing, metadata);

      let totalDiscount = 0;
      let totalSurcharge = 0;
      let totalAdjustment = 0;

      const appliedRules = [];

      for (const rule of applicableRules) {
        const ruleResult = this.applyRule(pricing, rule, metadata);
        
        if (ruleResult !== 0) {
          appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.ruleType,
            adjustmentType: rule.adjustmentType,
            adjustmentValue: rule.adjustmentValue,
            result: ruleResult,
          });

          switch (rule.adjustmentType) {
            case PricingType.DISCOUNT:
              totalDiscount += ruleResult;
              break;
            case PricingType.TAX:
            case PricingType.FEE:
              totalSurcharge += ruleResult;
              break;
            case PricingType.ADJUSTMENT:
              totalAdjustment += ruleResult;
              break;
          }
        }
      }

      const finalPremium = pricing.basePremium + (pricing.taxes || 0) + (pricing.fees || 0) - (pricing.discounts || 0) + (pricing.adjustments || 0);

      const calculatedPremium = Math.max(finalPremium, 0);

      pricing.taxes = (pricing.taxes || 0) + totalSurcharge;
      pricing.discounts = (pricing.discounts || 0) + totalDiscount;
      pricing.adjustments = (pricing.adjustments || 0) + totalAdjustment;
      pricing.totalPremium = calculatedPremium;

      pricing.pricingDetails = {
        ...pricing.pricingDetails,
        appliedRules,
        calculationTimestamp: new Date().toISOString(),
        basePremium: pricing.basePremium,
        totalDiscount,
        totalSurcharge,
        totalAdjustment,
        finalPremium: calculatedPremium,
      };

      return pricing;
    } catch (error) {
      this.logger.error('Error calculating final premium:', error);
      throw error;
    }
  }

  private async getApplicableRules(
    pricing: Pricing,
    metadata: Record<string, any>,
  ): Promise<PricingRule[]> {
    try {
      const cachedRules = await this.redisService.getCachedPricingRules();
      if (cachedRules) {
        const hydratedRules = cachedRules.map((rule) => Object.assign(new PricingRule(), rule));
        return this.filterApplicableRules(hydratedRules, pricing, metadata);
      }

      const rules = await this.pricingRuleRepository.find({
        where: {
          isActive: true,
        },
        order: { priority: 'DESC' },
      });

      await this.redisService.cachePricingRules(rules);

      return this.filterApplicableRules(rules, pricing, metadata);
    } catch (error) {
      this.logger.error('Error getting applicable rules:', error);
      return [];
    }
  }

  private filterApplicableRules(
    rules: PricingRule[],
    pricing: Pricing,
    metadata: Record<string, any>,
  ): PricingRule[] {
    return rules.filter(rule => {
      if (!rule.isCurrentlyValid()) {
        return false;
      }

      if (!rule.isApplicable(metadata)) {
        return false;
      }

      return true;
    });
  }

  private applyRule(
    pricing: Pricing,
    rule: PricingRule,
    metadata: Record<string, any>,
  ): number {
    let result = 0;

    if (rule.adjustmentPercentage) {
      result = (pricing.basePremium * rule.adjustmentPercentage) / 100;
    } else {
      result = rule.adjustmentValue;
    }

    return result;
  }
}
