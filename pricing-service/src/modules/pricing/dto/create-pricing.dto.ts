import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsNumber, IsString, IsOptional, IsDateString, IsObject, Min, Max } from 'class-validator';
import { PricingStatus } from '../../../entities/pricing.entity';

export class CreatePricingDto {
  @ApiProperty({
    description: 'Policy ID for which pricing is being calculated',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  policyId: string;

  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'Policy number',
    example: 'POL2024001',
  })
  @IsString()
  policyNumber: string;

  @ApiProperty({
    description: 'Base premium amount',
    example: 1000.00,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePremium: number;

  @ApiPropertyOptional({
    description: 'Taxes amount',
    example: 85.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxes?: number;

  @ApiPropertyOptional({
    description: 'Fees amount',
    example: 150.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fees?: number;

  @ApiPropertyOptional({
    description: 'Discounts amount',
    example: 100.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discounts?: number;

  @ApiPropertyOptional({
    description: 'Adjustments amount',
    example: -25.00,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  adjustments?: number;

  @ApiProperty({
    description: 'Total premium amount',
    example: 1110.00,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalPremium: number;

  @ApiProperty({
    description: 'Coverage amount',
    example: 100000.00,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  coverageAmount: number;

  @ApiPropertyOptional({
    description: 'Premium rate',
    example: 1.11,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  premiumRate?: number;

  @ApiProperty({
    description: 'Effective date',
    example: '2024-01-01',
  })
  @IsDateString()
  effectiveDate: string;

  @ApiPropertyOptional({
    description: 'Expiration date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({
    description: 'Pricing details',
    example: { riskScore: 0.8, region: 'SP', productType: 'auto' },
  })
  @IsOptional()
  @IsObject()
  pricingDetails?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'manual', approvedBy: 'admin' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
