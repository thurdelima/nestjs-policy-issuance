import { PartialType } from '@nestjs/swagger';
import { CreateCreditAssessmentDto } from './create-credit-assessment.dto';
import { IsOptional, IsString, IsNumber, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssessmentStatus, AssessmentResult, RiskLevel } from '../../../entities/credit-assessment.entity';

export class UpdateCreditAssessmentDto extends PartialType(CreateCreditAssessmentDto) {
  @ApiProperty({
    description: 'Assessment status',
    enum: AssessmentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(AssessmentStatus)
  status?: AssessmentStatus;

  @ApiProperty({
    description: 'Assessment result',
    enum: AssessmentResult,
    required: false,
  })
  @IsOptional()
  @IsEnum(AssessmentResult)
  result?: AssessmentResult;

  @ApiProperty({
    description: 'Credit score',
    required: false,
    example: 750,
  })
  @IsOptional()
  @IsNumber()
  creditScore?: number;

  @ApiProperty({
    description: 'Risk level',
    enum: RiskLevel,
    required: false,
  })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiProperty({
    description: 'Approved amount',
    required: false,
    example: 80000.00,
  })
  @IsOptional()
  @IsNumber()
  approvedAmount?: number;

  @ApiProperty({
    description: 'Interest rate',
    required: false,
    example: 12.5,
  })
  @IsOptional()
  @IsNumber()
  interestRate?: number;

  @ApiProperty({
    description: 'Term in months',
    required: false,
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  termMonths?: number;

  @ApiProperty({
    description: 'Rejection reason',
    required: false,
    example: 'Credit score too low',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiProperty({
    description: 'External data for credit assessment',
    required: false,
    example: {
      serasaScore: 750,
      spcStatus: 'clean',
      bankRelationship: {},
      previousLoans: [],
    },
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
    required: false,
    example: {
      incomeRatio: 2.5,
      debtToIncomeRatio: 0.3,
      creditHistoryScore: 750,
      employmentStability: 85,
      collateralValue: 150000,
    },
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
}
