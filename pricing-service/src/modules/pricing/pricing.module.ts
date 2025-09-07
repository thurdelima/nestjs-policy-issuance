import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pricing } from '../../entities/pricing.entity';
import { PricingRule } from '../../entities/pricing-rule.entity';
import { PricingHistory } from '../../entities/pricing-history.entity';
import { PricingController } from './pricing.controller';
import { PricingService } from './services/pricing.service';
import { PricingCalculationService } from './services/pricing-calculation.service';
import { PricingHistoryService } from './services/pricing-history.service';
import { RabbitMQModule } from '../../shared/rabbitmq/rabbitmq.module';
import { RedisModule } from '../../shared/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pricing, PricingRule, PricingHistory]),
    RabbitMQModule,
    RedisModule,
  ],
  controllers: [PricingController],
  providers: [
    PricingService,
    PricingCalculationService,
    PricingHistoryService,
  ],
  exports: [
    PricingService,
    PricingCalculationService,
    PricingHistoryService,
  ],
})
export class PricingModule {}
