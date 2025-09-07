import { PartialType } from '@nestjs/swagger';
import { CreatePolicyDto } from './create-policy.dto';
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PolicyStatus } from '../../../entities/policy.entity';

export class UpdatePolicyDto extends PartialType(CreatePolicyDto) {
  @ApiProperty({
    description: 'Policy status',
    enum: PolicyStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;

  @ApiProperty({
    description: 'Cancellation reason',
    required: false,
    example: 'Customer requested cancellation',
  })
  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @ApiProperty({
    description: 'Cancellation date',
    required: false,
    example: '2024-06-15',
  })
  @IsOptional()
  @IsDateString()
  cancellationDate?: string;

  @ApiProperty({
    description: 'Effective date',
    required: false,
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}
