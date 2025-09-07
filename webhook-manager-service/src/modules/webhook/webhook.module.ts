import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { RabbitMQModule } from '../../shared/rabbitmq/rabbitmq.module';
import { RedisModule } from '../../shared/redis/redis.module';

@Module({
  imports: [RabbitMQModule, RedisModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
