import { PartialType } from '@nestjs/swagger';
import { CreatePricingDto } from './create-pricing.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PricingStatus } from '../../../entities/pricing.entity';

export class UpdatePricingDto extends PartialType(CreatePricingDto) {
  @ApiPropertyOptional({
    description: 'Pricing status',
    enum: PricingStatus,
    example: PricingStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(PricingStatus)
  status?: PricingStatus;
}
