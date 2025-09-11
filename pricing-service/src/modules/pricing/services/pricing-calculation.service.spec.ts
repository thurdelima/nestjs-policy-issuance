import { Repository } from 'typeorm';
import { PricingCalculationService } from './pricing-calculation.service';
import { PricingRule, RuleType, PricingType } from '../../../entities/pricing-rule.entity';
import { Pricing } from '../../../entities/pricing.entity';
import { RedisService } from '../../../shared/redis/redis.service';

describe('PricingCalculationService', () => {
  let service: PricingCalculationService;
  let pricingRuleRepository: jest.Mocked<Repository<PricingRule>>;
  let redisService: jest.Mocked<RedisService>;

  const mockPricing: Pricing = {
    id: 'pricing-123',
    policyId: 'policy-456',
    customerId: 'customer-789',
    policyNumber: 'POL-001',
    status: 'draft' as any,
    basePremium: 1000,
    taxes: 0,
    fees: 0,
    discounts: 0,
    adjustments: 0,
    totalPremium: 0,
    coverageAmount: 100000,
    effectiveDate: new Date('2025-01-01'),
    pricingDetails: {},
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    get netPremium() { return this.basePremium + this.taxes + this.fees - this.discounts + this.adjustments; },
    get premiumRateCalculated() { return this.coverageAmount > 0 ? (this.totalPremium / this.coverageAmount) * 100 : 0; },
  } as Pricing;

  const mockRule1: PricingRule = {
    id: 'rule-1',
    name: 'Young Driver Discount',
    ruleType: RuleType.AGE,
    operator: 'less_than' as any,
    conditionValue: { age: 30 },
    adjustmentType: PricingType.DISCOUNT,
    adjustmentValue: 100,
    adjustmentPercentage: 10,
    priority: 1,
    isActive: true,
    effectiveDate: new Date('2025-01-01'),
    isCurrentlyValid: jest.fn().mockReturnValue(true),
    isApplicable: jest.fn().mockReturnValue(true),
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  } as any;

  const mockRule2: PricingRule = {
    id: 'rule-2',
    name: 'High Risk Surcharge',
    ruleType: RuleType.RISK_LEVEL,
    operator: 'equals' as any,
    conditionValue: { riskLevel: 'high' },
    adjustmentType: PricingType.TAX,
    adjustmentValue: 50,
    adjustmentPercentage: null,
    priority: 2,
    isActive: true,
    effectiveDate: new Date('2025-01-01'),
    isCurrentlyValid: jest.fn().mockReturnValue(true),
    isApplicable: jest.fn().mockReturnValue(true),
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  } as any;

  beforeEach(() => {
    pricingRuleRepository = {
      find: jest.fn(),
    } as any;

    redisService = {
      getCachedPricingRules: jest.fn(),
      cachePricingRules: jest.fn(),
    } as any;

    service = new PricingCalculationService(pricingRuleRepository, redisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateFinalPremium', () => {
    it('should calculate final premium with applicable rules', async () => {
      const getApplicableRulesSpy = jest.spyOn(service as any, 'getApplicableRules')
        .mockResolvedValue([mockRule1, mockRule2]);
      const applyRuleSpy = jest.spyOn(service as any, 'applyRule')
        .mockReturnValueOnce(100) // Discount
        .mockReturnValueOnce(50); // Surcharge
      

      const result = await service.calculateFinalPremium(mockPricing, { age: 25 });

      expect(getApplicableRulesSpy).toHaveBeenCalledWith(mockPricing, { age: 25 });
      expect(applyRuleSpy).toHaveBeenCalledTimes(2);
      
      // Verifica cálculos
      expect(result.taxes).toBe(50); // Surcharge added to taxes
      expect(result.discounts).toBe(100); // Discount added
      expect(result.adjustments).toBe(0);
      expect(result.totalPremium).toBe(1000); // Calculado antes de atualizar os valores
      
      // Verifica metadados
      expect(result.pricingDetails).toEqual({
        appliedRules: [
          {
            ruleId: 'rule-1',
            ruleName: 'Young Driver Discount',
            ruleType: RuleType.AGE,
            adjustmentType: PricingType.DISCOUNT,
            adjustmentValue: 100,
            result: 100,
          },
          {
            ruleId: 'rule-2',
            ruleName: 'High Risk Surcharge',
            ruleType: RuleType.RISK_LEVEL,
            adjustmentType: PricingType.TAX,
            adjustmentValue: 50,
            result: 50,
          },
        ],
        calculationTimestamp: expect.any(String),
        basePremium: 1000,
        totalDiscount: 100,
        totalSurcharge: 50,
        totalAdjustment: 0,
        finalPremium: 1000,
      });

      
    });

    it('should calculate final premium without applicable rules', async () => {
      const freshPricing = { 
        ...mockPricing, 
        taxes: 0, 
        fees: 0, 
        discounts: 0, 
        adjustments: 0,
        get netPremium() { return this.basePremium + this.taxes + this.fees - this.discounts + this.adjustments; },
        get premiumRateCalculated() { return this.coverageAmount > 0 ? (this.totalPremium / this.coverageAmount) * 100 : 0; },
      };
      const getApplicableRulesSpy = jest.spyOn(service as any, 'getApplicableRules')
        .mockResolvedValue([]);
      

      const result = await service.calculateFinalPremium(freshPricing);

      expect(getApplicableRulesSpy).toHaveBeenCalledWith(freshPricing, {});
      expect(result.totalPremium).toBe(1000); // basePremium only (sem regras aplicadas)
      expect(result.pricingDetails.appliedRules).toEqual([]);
      
    });

    it('should ensure minimum premium of 0', async () => {
      const pricingWithNegative = { 
        ...mockPricing, 
        basePremium: 50,
        get netPremium() { return this.basePremium + this.taxes + this.fees - this.discounts + this.adjustments; },
        get premiumRateCalculated() { return this.coverageAmount > 0 ? (this.totalPremium / this.coverageAmount) * 100 : 0; },
      };
      const getApplicableRulesSpy = jest.spyOn(service as any, 'getApplicableRules')
        .mockResolvedValue([mockRule1]); // 100 discount
      const applyRuleSpy = jest.spyOn(service as any, 'applyRule').mockReturnValue(100);

      const result = await service.calculateFinalPremium(pricingWithNegative);

      expect(result.totalPremium).toBe(0); // Math.max(50 - 100, 0) = 0
    });

    it('should handle percentage-based adjustments', async () => {
      const freshPricing = { 
        ...mockPricing, 
        taxes: 0, 
        fees: 0, 
        discounts: 0, 
        adjustments: 0,
        get netPremium() { return this.basePremium + this.taxes + this.fees - this.discounts + this.adjustments; },
        get premiumRateCalculated() { return this.coverageAmount > 0 ? (this.totalPremium / this.coverageAmount) * 100 : 0; },
      };
      const percentageRule = {
        ...mockRule1,
        adjustmentPercentage: 15,
        adjustmentValue: null,
      };
      const getApplicableRulesSpy = jest.spyOn(service as any, 'getApplicableRules')
        .mockResolvedValue([percentageRule]);
      const applyRuleSpy = jest.spyOn(service as any, 'applyRule').mockReturnValue(150); // 15% of 1000

      const result = await service.calculateFinalPremium(freshPricing);

      expect(result.discounts).toBe(150);
      expect(result.totalPremium).toBe(1000); // Calculado antes de aplicar desconto
    });

    it('should throw and log error on calculation failure', async () => {
      const getApplicableRulesSpy = jest.spyOn(service as any, 'getApplicableRules')
        .mockRejectedValue(new Error('Database error'));
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      await expect(service.calculateFinalPremium(mockPricing)).rejects.toThrow('Database error');
      expect(loggerErrorSpy).toHaveBeenCalledWith('Error calculating final premium:', expect.any(Error));
    });
  });

  describe('getApplicableRules', () => {
    it('should return cached rules when available', async () => {
      const cachedRules = [mockRule1, mockRule2];
      redisService.getCachedPricingRules.mockResolvedValue(cachedRules);
      const filterApplicableRulesSpy = jest.spyOn(service as any, 'filterApplicableRules')
        .mockReturnValue([mockRule1]);

      const result = await (service as any).getApplicableRules(mockPricing, { age: 25 });

      expect(redisService.getCachedPricingRules).toHaveBeenCalled();
      expect(pricingRuleRepository.find).not.toHaveBeenCalled();
      expect(filterApplicableRulesSpy).toHaveBeenCalledWith(cachedRules, mockPricing, { age: 25 });
      expect(result).toEqual([mockRule1]);
    });

    it('should fetch from database when cache miss', async () => {
      redisService.getCachedPricingRules.mockResolvedValue(null);
      pricingRuleRepository.find.mockResolvedValue([mockRule1, mockRule2]);
      redisService.cachePricingRules.mockResolvedValue(undefined);
      const filterApplicableRulesSpy = jest.spyOn(service as any, 'filterApplicableRules')
        .mockReturnValue([mockRule1]);

      const result = await (service as any).getApplicableRules(mockPricing, { age: 25 });

      expect(redisService.getCachedPricingRules).toHaveBeenCalled();
      expect(pricingRuleRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { priority: 'DESC' },
      });
      expect(redisService.cachePricingRules).toHaveBeenCalledWith([mockRule1, mockRule2]);
      expect(filterApplicableRulesSpy).toHaveBeenCalledWith([mockRule1, mockRule2], mockPricing, { age: 25 });
      expect(result).toEqual([mockRule1]);
    });

    it('should return empty array and log error on failure', async () => {
      redisService.getCachedPricingRules.mockRejectedValue(new Error('Redis error'));
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      const result = await (service as any).getApplicableRules(mockPricing, {});

      expect(result).toEqual([]);
      expect(loggerErrorSpy).toHaveBeenCalledWith('Error getting applicable rules:', expect.any(Error));
    });
  });

  describe('filterApplicableRules', () => {
    it('should filter rules that are valid and applicable', async () => {
      const validRule = { ...mockRule1, isCurrentlyValid: jest.fn().mockReturnValue(true), isApplicable: jest.fn().mockReturnValue(true) };
      const invalidRule = { ...mockRule2, isCurrentlyValid: jest.fn().mockReturnValue(false), isApplicable: jest.fn().mockReturnValue(true) };
      const notApplicableRule = { ...mockRule1, isCurrentlyValid: jest.fn().mockReturnValue(true), isApplicable: jest.fn().mockReturnValue(false) };

      const result = (service as any).filterApplicableRules([validRule, invalidRule, notApplicableRule], mockPricing, { age: 25 });

      expect(result).toEqual([validRule]);
      expect(validRule.isCurrentlyValid).toHaveBeenCalled();
      expect(validRule.isApplicable).toHaveBeenCalledWith({ age: 25 });
      expect(invalidRule.isCurrentlyValid).toHaveBeenCalled();
      expect(notApplicableRule.isApplicable).toHaveBeenCalledWith({ age: 25 });
    });

    it('should return empty array when no rules are applicable', async () => {
      const invalidRule = { ...mockRule1, isCurrentlyValid: jest.fn().mockReturnValue(false) };
      const notApplicableRule = { ...mockRule2, isCurrentlyValid: jest.fn().mockReturnValue(true), isApplicable: jest.fn().mockReturnValue(false) };

      const result = (service as any).filterApplicableRules([invalidRule, notApplicableRule], mockPricing, {});

      expect(result).toEqual([]);
    });
  });

  describe('applyRule', () => {
    it('should apply percentage-based adjustment', () => {
      const percentageRule = { ...mockRule1, adjustmentPercentage: 20, adjustmentValue: null };
      
      const result = (service as any).applyRule(mockPricing, percentageRule, {});

      expect(result).toBe(200); // 20% of 1000
    });

    it('should apply fixed amount adjustment', () => {
      const fixedRule = { ...mockRule1, adjustmentPercentage: null, adjustmentValue: 75 };
      
      const result = (service as any).applyRule(mockPricing, fixedRule, {});

      expect(result).toBe(75);
    });

    it('should prioritize percentage over fixed value', () => {
      const mixedRule = { ...mockRule1, adjustmentPercentage: 10, adjustmentValue: 50 };
      
      const result = (service as any).applyRule(mockPricing, mixedRule, {});

      expect(result).toBe(100); // 10% of 1000, not 50
    });
  });
});
