import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsBoolean, IsDateString, IsObject, Min, IsOptional } from 'class-validator';
import { RuleType, RuleOperator, PricingType } from '../../../entities/pricing-rule.entity';

export class CreatePricingRuleDto {
  @ApiProperty({
    description: 'Rule name',
    example: 'Age Discount - Young',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Rule description',
    example: 'Discount for customers under 30',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Rule type',
    enum: RuleType,
    example: RuleType.AGE,
  })
  @IsEnum(RuleType)
  ruleType: RuleType;

  @ApiProperty({
    description: 'Rule operator',
    enum: RuleOperator,
    example: RuleOperator.LESS_THAN,
  })
  @IsEnum(RuleOperator)
  operator: RuleOperator;

  @ApiProperty({
    description: 'Condition value as JSON object',
    example: { age: 30 },
  })
  @IsObject()
  conditionValue: Record<string, any>;

  @ApiProperty({
    description: 'Adjustment type',
    enum: PricingType,
    example: PricingType.DISCOUNT,
  })
  @IsEnum(PricingType)
  adjustmentType: PricingType;

  @ApiProperty({
    description: 'Adjustment value',
    example: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  adjustmentValue: number;

  @ApiPropertyOptional({
    description: 'Adjustment percentage',
    example: 10.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  adjustmentPercentage?: number;

  @ApiProperty({
    description: 'Rule priority (higher number = higher priority)',
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  priority: number;

  @ApiPropertyOptional({
    description: 'Is rule active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
}
