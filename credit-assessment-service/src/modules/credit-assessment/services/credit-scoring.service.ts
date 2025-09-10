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

    const incomeRatio = this.calculateIncomeRatio(assessmentCriteria, requestedAmount);
    const debtToIncomeRatio = this.calculateDebtToIncomeRatio(assessmentCriteria);
    const creditHistoryScore = this.calculateCreditHistoryScore(externalData);
    const employmentStability = this.calculateEmploymentStability(assessmentCriteria);
    const collateralValue = this.calculateCollateralValue(assessmentCriteria);

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

    const finalScore = Math.round(weightedScore * 10);

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
    
    if (ratio >= 3) return 100;
    if (ratio >= 2) return 80;
    if (ratio >= 1.5) return 60;
    if (ratio >= 1) return 40;
    return 20;
  }

  private calculateDebtToIncomeRatio(assessmentCriteria: any): number {
    if (!assessmentCriteria?.debtToIncomeRatio) return 0;
    
    const ratio = assessmentCriteria.debtToIncomeRatio;
    
    if (ratio <= 0.3) return 100;
    if (ratio <= 0.4) return 80;
    if (ratio <= 0.5) return 60;
    if (ratio <= 0.6) return 40;
    return 20;
  }

  private calculateCreditHistoryScore(externalData: any): number {
    if (externalData?.serasaScore) {
      return Math.min(externalData.serasaScore, 100);
    }

    let score = 50;

    if (externalData?.spcStatus === 'clean') {
      score += 30;
    } else if (externalData?.spcStatus === 'restricted') {
      score += 10;
    }

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
    if (assessmentCriteria?.employmentStability) {
      return Math.min(assessmentCriteria.employmentStability, 100);
    }

    return 50;
  }

  private calculateCollateralValue(assessmentCriteria: any): number {
    if (assessmentCriteria?.collateralValue) {
      return Math.min(assessmentCriteria.collateralValue, 100);
    }

    return 0;
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
