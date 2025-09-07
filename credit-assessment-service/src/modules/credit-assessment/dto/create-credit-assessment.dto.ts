import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsObject, Min, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateCreditAssessmentDto {
  @ApiProperty({
    description: 'Policy ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  policyId: string;

  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'Policy number',
    example: 'FIA202401000001',
  })
  @IsString()
  policyNumber: string;

  @ApiProperty({
    description: 'Requested amount',
    example: 100000.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  requestedAmount: number;

  @ApiProperty({
    description: 'External data for credit assessment',
    example: {
      serasaScore: 750,
      spcStatus: 'clean',
      bankRelationship: {
        hasAccount: true,
        accountAge: 24,
        averageBalance: 5000,
        hasCreditCard: true,
        hasLoan: false,
      },
      previousLoans: [
        {
          id: 'loan-1',
          amount: 10000,
          status: 'paid',
          paidAt: '2023-06-15',
          termMonths: 12,
        },
      ],
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  externalData?: {
    serasaScore?: number;
    spcStatus?: string;
    bankRelationship?: any;
    previousLoans?: any[];
  };

  @ApiProperty({
    description: 'Assessment criteria data',
    example: {
      incomeRatio: 2.5,
      debtToIncomeRatio: 0.3,
      creditHistoryScore: 750,
      employmentStability: 85,
      collateralValue: 150000,
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  assessmentCriteria?: {
    incomeRatio: number;
    debtToIncomeRatio: number;
    creditHistoryScore: number;
    employmentStability: number;
    collateralValue?: number;
  };

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
    example: {
      collateralValue: 150000,
      loanPurpose: 'home_purchase',
      additionalNotes: 'First-time borrower',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
