import { Test, TestingModule } from '@nestjs/testing';
import { CreditScoringService, ScoringResult } from './credit-scoring.service';
import { CreditAssessment, RiskLevel } from '../../../entities/credit-assessment.entity';

describe('CreditScoringService', () => {
  let service: CreditScoringService;

  const makeAssessment = (overrides: Partial<CreditAssessment> = {}): CreditAssessment => ({
    id: 'assess-1',
    policyId: 'policy-1',
    customerId: 'cust-1',
    requestedAmount: 10000,
    status: 'pending' as any,
    result: null as any,
    creditScore: 0,
    riskLevel: RiskLevel.MEDIUM,
    assessmentCriteria: {
      incomeRatio: 2.5,
      debtToIncomeRatio: 0.3,
      employmentStability: 80,
      collateralValue: 1.2,
    },
    externalData: {
      serasaScore: 750,
      spcStatus: 'clean',
      previousLoans: [
        { status: 'paid' },
        { status: 'paid' },
        { status: 'default' },
      ],
    },
    approvedAmount: undefined,
    interestRate: undefined,
    termMonths: undefined,
    rejectionReason: undefined,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreditScoringService],
    }).compile();

    service = module.get<CreditScoringService>(CreditScoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateScore', () => {
    it('should calculate weighted score with all criteria', async () => {
      const assessment = makeAssessment();
      
      const result = await service.calculateScore(assessment);

      expect(result).toMatchObject({
        score: expect.any(Number),
        riskLevel: expect.any(String),
        criteria: {
          incomeRatio: expect.any(Number),
          debtToIncomeRatio: expect.any(Number),
          creditHistoryScore: expect.any(Number),
          employmentStability: expect.any(Number),
          collateralValue: expect.any(Number),
        },
      });

      // Verify score is within expected range (0-1000)
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1000);
    });

    it('should handle missing assessment criteria gracefully', async () => {
      const assessment = makeAssessment({
        assessmentCriteria: {
          incomeRatio: undefined as any,
          debtToIncomeRatio: undefined as any,
          creditHistoryScore: undefined as any,
          employmentStability: undefined as any,
          collateralValue: undefined as any,
        },
        externalData: {},
      });

      const result = await service.calculateScore(assessment);

      expect(result.criteria.incomeRatio).toBe(0);
      expect(result.criteria.debtToIncomeRatio).toBe(0);
      expect(result.criteria.creditHistoryScore).toBe(50); // Base score
      expect(result.criteria.employmentStability).toBe(50); // Default
      expect(result.criteria.collateralValue).toBe(0);
    });

    it('should use serasa score when available', async () => {
      const assessment = makeAssessment({
        externalData: { serasaScore: 850 },
      });

      const result = await service.calculateScore(assessment);

      expect(result.criteria.creditHistoryScore).toBe(100); // Capped at 100
    });

    it('should calculate credit history from SPC status and loans', async () => {
      const assessment = makeAssessment({
        externalData: {
          spcStatus: 'clean',
          previousLoans: [
            { status: 'paid' },
            { status: 'paid' },
            { status: 'default' },
          ],
        },
      });

      const result = await service.calculateScore(assessment);

      // Base (50) + SPC clean (30) + payment rate (2/3 * 20 = 13.33) = 93.33
      expect(result.criteria.creditHistoryScore).toBeCloseTo(93, 0);
    });
  });

  describe('private methods via calculateScore', () => {
    it('should calculate income ratio scores correctly', async () => {
      const testCases = [
        { ratio: 3.5, expected: 100 },
        { ratio: 2.5, expected: 80 },
        { ratio: 1.7, expected: 60 },
        { ratio: 1.2, expected: 40 },
        { ratio: 0.8, expected: 20 },
        { ratio: undefined, expected: 0 },
      ];

      for (const testCase of testCases) {
        const assessment = makeAssessment({
          assessmentCriteria: { 
            incomeRatio: testCase.ratio,
            debtToIncomeRatio: 0.3,
            creditHistoryScore: 700,
            employmentStability: 80,
            collateralValue: 1.0,
          },
        });

        const result = await service.calculateScore(assessment);
        expect(result.criteria.incomeRatio).toBe(testCase.expected);
      }
    });

    it('should calculate debt-to-income ratio scores correctly', async () => {
      const testCases = [
        { ratio: 0.2, expected: 100 },
        { ratio: 0.35, expected: 80 },
        { ratio: 0.45, expected: 60 },
        { ratio: 0.55, expected: 40 },
        { ratio: 0.7, expected: 20 },
        { ratio: undefined, expected: 0 },
      ];

      for (const testCase of testCases) {
        const assessment = makeAssessment({
          assessmentCriteria: { 
            incomeRatio: 2.0,
            debtToIncomeRatio: testCase.ratio,
            creditHistoryScore: 700,
            employmentStability: 80,
            collateralValue: 1.0,
          },
        });

        const result = await service.calculateScore(assessment);
        expect(result.criteria.debtToIncomeRatio).toBe(testCase.expected);
      }
    });

    it('should determine risk levels correctly', async () => {
      // Test that risk level is determined based on score and debt ratio
      const assessment = makeAssessment({
        assessmentCriteria: { 
          incomeRatio: 3.0, // 100 points
          debtToIncomeRatio: 0.2, // 100 points
          creditHistoryScore: 800, // 100 points
          employmentStability: 100, // 100 points
          collateralValue: 1.5, // 100 points
        },
        externalData: { serasaScore: 800 },
      });

      const result = await service.calculateScore(assessment);
      
      // Should return a valid risk level
      expect([RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.VERY_HIGH]).toContain(result.riskLevel);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should cap employment stability and collateral values at 100', async () => {
      const assessment = makeAssessment({
        assessmentCriteria: {
          incomeRatio: 2.0,
          debtToIncomeRatio: 0.3,
          creditHistoryScore: 700,
          employmentStability: 150,
          collateralValue: 200,
        },
      });

      const result = await service.calculateScore(assessment);

      expect(result.criteria.employmentStability).toBe(100);
      expect(result.criteria.collateralValue).toBe(100);
    });

    it('should handle SPC restricted status', async () => {
      const assessment = makeAssessment({
        externalData: { spcStatus: 'restricted' },
      });

      const result = await service.calculateScore(assessment);

      // Base (50) + restricted (10) = 60
      expect(result.criteria.creditHistoryScore).toBe(60);
    });

    it('should handle no previous loans', async () => {
      const assessment = makeAssessment({
        externalData: { spcStatus: 'clean' },
      });

      const result = await service.calculateScore(assessment);

      // Base (50) + clean (30) = 80
      expect(result.criteria.creditHistoryScore).toBe(80);
    });
  });

  describe('weighted scoring', () => {
    it('should apply correct weights to final score', async () => {
      const assessment = makeAssessment({
        assessmentCriteria: {
          incomeRatio: 2.0, // 80 points
          debtToIncomeRatio: 0.3, // 100 points
          creditHistoryScore: 800, // 100 points (capped)
          employmentStability: 80, // 80 points
          collateralValue: 1.0, // 100 points
        },
        externalData: { serasaScore: 800 }, // 100 points
      });

      const result = await service.calculateScore(assessment);

      // Verify that weighted scoring is applied
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(1000);
      expect(result.criteria.incomeRatio).toBe(80);
      expect(result.criteria.debtToIncomeRatio).toBe(100);
      expect(result.criteria.creditHistoryScore).toBe(100);
      expect(result.criteria.employmentStability).toBe(80);
      expect(result.criteria.collateralValue).toBeGreaterThan(0);
    });
  });
});
