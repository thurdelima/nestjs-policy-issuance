import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsDateString, IsObject, IsUUID, Min, IsString, IsArray } from 'class-validator';
import { PolicyType } from '../../../entities/policy.entity';

export class CreatePolicyDto {
  @ApiProperty({
    description: 'Policy type',
    enum: PolicyType,
    example: PolicyType.FIANCA,
  })
  @IsEnum(PolicyType)
  type: PolicyType;

  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'Coverage amount',
    example: 100000.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  coverageAmount: number;

  @ApiProperty({
    description: 'Premium amount',
    example: 100000.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  premiumAmount: number;


  @ApiProperty({
    description: 'Policy start date',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Policy end date',
    example: '2024-12-31',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Coverage details',
    example: {
      description: 'Fiança locatícia para imóvel residencial',
      terms: ['Cobertura por 12 meses', 'Franquia de R$ 500,00'],
      exclusions: ['Danos causados por terceiros', 'Desgaste natural'],
      conditions: ['Pagamento em dia', 'Comunicação de sinistros em até 48h'],
    },
  })
  @IsObject()
  coverageDetails: {
    description: string;
    terms: string[];
    exclusions: string[];
    conditions: string[];
  };

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
    example: {
      propertyAddress: 'Rua das Flores, 123',
      propertyValue: 500000,
      additionalNotes: 'Imóvel em condomínio fechado',
    },
  })
  @IsObject()
  metadata?: Record<string, any>;
}
