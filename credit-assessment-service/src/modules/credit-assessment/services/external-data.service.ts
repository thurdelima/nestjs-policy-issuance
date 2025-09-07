import { Injectable, Logger } from '@nestjs/common';
import { CreditAssessment } from '../../../entities/credit-assessment.entity';

@Injectable()
export class ExternalDataService {
  private readonly logger = new Logger(ExternalDataService.name);

  async gatherExternalData(assessment: CreditAssessment): Promise<any> {
    // Since customerData is not available, we'll use policyId as identifier
    const { policyId } = assessment;
    
    this.logger.log(`Gathering external data for policy: ${policyId}`);

    try {
      // Simulate external API calls using policyId as identifier
      const externalData = {
        serasaScore: await this.getSerasaScore(policyId),
        spcStatus: await this.getSPCStatus(policyId),
        bankRelationship: await this.getBankRelationship(policyId),
        previousLoans: await this.getPreviousLoans(policyId),
      };

      this.logger.log('External data gathered successfully');
      return externalData;

    } catch (error) {
      this.logger.error('Failed to gather external data:', error);
      
      // Return default values if external services fail
      return {
        serasaScore: 500, // Default score
        spcStatus: 'unknown',
        bankRelationship: null,
        previousLoans: [],
      };
    }
  }

  private async getSerasaScore(policyId: string): Promise<number> {
    // Simulate Serasa API call
    this.logger.log(`Calling Serasa API for Policy: ${policyId}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate score calculation based on policyId (for demo purposes)
    const policyNumber = parseInt(policyId.replace(/\D/g, '').slice(-4));
    const baseScore = 400 + (policyNumber % 400); // Score between 400-800
    
    this.logger.log(`Serasa score: ${baseScore}`);
    return baseScore;
  }

  private async getSPCStatus(policyId: string): Promise<string> {
    // Simulate SPC API call
    this.logger.log(`Calling SPC API for Policy: ${policyId}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate SPC status (90% clean, 10% restricted)
    const policyNumber = parseInt(policyId.replace(/\D/g, '').slice(-2));
    const status = policyNumber < 90 ? 'clean' : 'restricted';
    
    this.logger.log(`SPC status: ${status}`);
    return status;
  }

  private async getBankRelationship(policyId: string): Promise<any> {
    // Simulate bank relationship API call
    this.logger.log(`Calling bank relationship API for Policy: ${policyId}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate bank relationship data
    const policyNumber = parseInt(policyId.replace(/\D/g, '').slice(-3));
    
    return {
      hasAccount: policyNumber > 100,
      accountAge: policyNumber > 200 ? Math.floor(policyNumber / 10) : 0,
      averageBalance: policyNumber > 300 ? policyNumber * 100 : 0,
      hasCreditCard: policyNumber > 150,
      hasLoan: policyNumber > 250,
    };
  }

  private async getPreviousLoans(policyId: string): Promise<any[]> {
    // Simulate previous loans API call
    this.logger.log(`Calling previous loans API for Policy: ${policyId}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Simulate previous loans data
    const policyNumber = parseInt(policyId.replace(/\D/g, '').slice(-2));
    
    if (policyNumber < 30) {
      return [
        {
          id: 'loan-1',
          amount: 10000,
          status: 'paid',
          paidAt: new Date('2023-06-15'),
          termMonths: 12,
        },
        {
          id: 'loan-2',
          amount: 5000,
          status: 'paid',
          paidAt: new Date('2022-12-10'),
          termMonths: 6,
        },
      ];
    } else if (policyNumber < 60) {
      return [
        {
          id: 'loan-1',
          amount: 15000,
          status: 'paid',
          paidAt: new Date('2023-08-20'),
          termMonths: 18,
        },
      ];
    } else {
      return [];
    }
  }

  // Method to simulate real-time credit bureau integration
  async getRealTimeCreditScore(policyId: string): Promise<number> {
    this.logger.log(`Getting real-time credit score for Policy: ${policyId}`);
    
    // In a real implementation, this would call actual credit bureau APIs
    // For now, we'll simulate with a more sophisticated algorithm
    
    const policyNumber = parseInt(policyId.replace(/\D/g, ''));
    const baseScore = 300 + (policyNumber % 500); // Score between 300-800
    
    // Add some randomness to simulate real-time variations
    const variation = (Math.random() - 0.5) * 50;
    const finalScore = Math.max(300, Math.min(800, baseScore + variation));
    
    this.logger.log(`Real-time credit score: ${Math.round(finalScore)}`);
    return Math.round(finalScore);
  }

  // Method to check for fraud indicators
  async checkFraudIndicators(policyId: string): Promise<any> {
    this.logger.log(`Checking fraud indicators for Policy: ${policyId}`);
    
    // Simulate fraud detection API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const indicators = {
      isBlacklisted: false,
      hasSuspiciousActivity: false,
      identityVerification: 'passed',
      riskScore: Math.random() * 100,
    };
    
    // Simulate some fraud indicators based on policyId
    const policyNumber = parseInt(policyId.replace(/\D/g, '').slice(-3));
    if (policyNumber < 50) {
      indicators.isBlacklisted = true;
    }
    if (policyNumber > 800) {
      indicators.hasSuspiciousActivity = true;
    }
    
    this.logger.log('Fraud indicators checked');
    return indicators;
  }
}
