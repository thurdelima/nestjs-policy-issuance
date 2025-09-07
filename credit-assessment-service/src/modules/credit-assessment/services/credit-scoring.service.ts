import { Injectable } from '@nestjs/common';
import { CreditAssessment, RiskLevel } from '../../../entities/credit-assessment.entity';

export interface ScoringResult {
  score: number;
  riskLevel: RiskLevel;
  criteria: {
    incomeRatio: number;
    debtToIncomeRatio: number;
    creditHistoryScore: number;
    employmentStability: number;
    collateralValue?: number;
  };
}

@Injectable()
export class CreditScoringService {
  async calculateScore(assessment: CreditAssessment): Promise<ScoringResult> {
    const { externalData, requestedAmount, assessmentCriteria } = assessment;

    // Calculate individual criteria scores using available data
    const incomeRatio = this.calculateIncomeRatio(assessmentCriteria, requestedAmount);
    const debtToIncomeRatio = this.calculateDebtToIncomeRatio(assessmentCriteria);
    const creditHistoryScore = this.calculateCreditHistoryScore(externalData);
    const employmentStability = this.calculateEmploymentStability(assessmentCriteria);
    const collateralValue = this.calculateCollateralValue(assessmentCriteria);

    // Weighted scoring
    const weights = {
      incomeRatio: 0.25,
      debtToIncomeRatio: 0.20,
      creditHistoryScore: 0.30,
      employmentStability: 0.15,
      collateralValue: 0.10,
    };

    const weightedScore = 
      (incomeRatio * weights.incomeRatio) +
      (debtToIncomeRatio * weights.debtToIncomeRatio) +
      (creditHistoryScore * weights.creditHistoryScore) +
      (employmentStability * weights.employmentStability) +
      (collateralValue * weights.collateralValue);

    // Convert to 0-1000 scale
    const finalScore = Math.round(weightedScore * 10);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(finalScore, debtToIncomeRatio);

    return {
      score: finalScore,
      riskLevel,
      criteria: {
        incomeRatio,
        debtToIncomeRatio,
        creditHistoryScore,
        employmentStability,
        collateralValue,
      },
    };
  }

  private calculateIncomeRatio(assessmentCriteria: any, requestedAmount: number): number {
    if (!assessmentCriteria?.incomeRatio) return 0;
    
    const ratio = assessmentCriteria.incomeRatio;
    
    // Score based on income ratio (higher is better)
    if (ratio >= 3) return 100; // 3x or more
    if (ratio >= 2) return 80;  // 2x
    if (ratio >= 1.5) return 60; // 1.5x
    if (ratio >= 1) return 40;   // 1x
    return 20; // Less than 1x
  }

  private calculateDebtToIncomeRatio(assessmentCriteria: any): number {
    if (!assessmentCriteria?.debtToIncomeRatio) return 0;
    
    const ratio = assessmentCriteria.debtToIncomeRatio;
    
    // Score based on debt-to-income ratio (lower is better)
    if (ratio <= 0.3) return 100; // 30% or less
    if (ratio <= 0.4) return 80;  // 40%
    if (ratio <= 0.5) return 60;  // 50%
    if (ratio <= 0.6) return 40;  // 60%
    return 20; // More than 60%
  }

  private calculateCreditHistoryScore(externalData: any): number {
    // Use external credit bureau score if available
    if (externalData?.serasaScore) {
      return Math.min(externalData.serasaScore, 100);
    }

    // Fallback scoring based on available data
    let score = 50; // Base score

    // Check SPC status
    if (externalData?.spcStatus === 'clean') {
      score += 30;
    } else if (externalData?.spcStatus === 'restricted') {
      score += 10;
    }

    // Check previous loans
    if (externalData?.previousLoans) {
      const paidLoans = externalData.previousLoans.filter((loan: any) => loan.status === 'paid');
      const totalLoans = externalData.previousLoans.length;
      
      if (totalLoans > 0) {
        const paymentRate = paidLoans.length / totalLoans;
        score += paymentRate * 20;
      }
    }

    return Math.min(score, 100);
  }

  private calculateEmploymentStability(assessmentCriteria: any): number {
    // Use employment stability score from assessment criteria
    if (assessmentCriteria?.employmentStability) {
      return Math.min(assessmentCriteria.employmentStability, 100);
    }

    // Default score if not available
    return 50;
  }

  private calculateCollateralValue(assessmentCriteria: any): number {
    // Use collateral value from assessment criteria
    if (assessmentCriteria?.collateralValue) {
      return Math.min(assessmentCriteria.collateralValue, 100);
    }

    return 0; // No collateral
  }

  private determineRiskLevel(score: number, debtToIncomeRatio: number): RiskLevel {
    if (score >= 700 && debtToIncomeRatio <= 0.4) {
      return RiskLevel.LOW;
    } else if (score >= 600 && debtToIncomeRatio <= 0.5) {
      return RiskLevel.MEDIUM;
    } else if (score >= 500 && debtToIncomeRatio <= 0.6) {
      return RiskLevel.HIGH;
    } else {
      return RiskLevel.VERY_HIGH;
    }
  }
}
