import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any;
  private channel: any;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672');
      
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      this.logger.log('Connected to RabbitMQ');

      // Setup pricing-related exchanges and queues
      await this.setupPricingQueues();
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  private async setupPricingQueues() {
    const exchange = 'pricing.exchange';
    
    // Declare exchange
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    // Pricing calculation queue
    await this.channel.assertQueue('pricing.calculate', { durable: true });
    await this.channel.bindQueue('pricing.calculate', exchange, 'pricing.calculate');

    // Pricing rule updates queue
    await this.channel.assertQueue('pricing.rule.updated', { durable: true });
    await this.channel.bindQueue('pricing.rule.updated', exchange, 'pricing.rule.updated');

    // Pricing approval queue
    await this.channel.assertQueue('pricing.approval', { durable: true });
    await this.channel.bindQueue('pricing.approval', exchange, 'pricing.approval');

    this.logger.log('Pricing queues setup completed');
  }

  async publishMessage(exchange: string, routingKey: string, message: any) {
    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      await this.channel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        timestamp: Date.now(),
      });
      
      this.logger.log(`Message published to ${exchange} with routing key ${routingKey}`);
    } catch (error) {
      this.logger.error('Failed to publish message:', error);
      throw error;
    }
  }

  async consumeMessage(queue: string, callback: (message: any) => Promise<void>) {
    try {
      await this.channel.consume(queue, async (msg: any) => {
        if (msg) {
          try {
            const message = JSON.parse(msg.content.toString());
            await callback(message);
            this.channel.ack(msg);
          } catch (error) {
            this.logger.error(`Error processing message from ${queue}:`, error);
            this.channel.nack(msg, false, false);
          }
        }
      });
      
      this.logger.log(`Started consuming messages from ${queue}`);
    } catch (error) {
      this.logger.error(`Failed to consume messages from ${queue}:`, error);
      throw error;
    }
  }

  // Pricing-specific methods
  async publishPricingCalculationRequest(policyId: string, pricingData: any) {
    await this.publishMessage('pricing.exchange', 'pricing.calculate', {
      policyId,
      pricingData,
      timestamp: new Date().toISOString(),
    });
  }

  async publishPricingResult(policyId: string, pricingResult: any) {
    await this.publishMessage('pricing.exchange', 'pricing.result', {
      policyId,
      pricingResult,
      timestamp: new Date().toISOString(),
    });
  }

  async publishPricingRuleUpdate(ruleId: string, ruleData: any) {
    await this.publishMessage('pricing.exchange', 'pricing.rule.updated', {
      ruleId,
      ruleData,
      timestamp: new Date().toISOString(),
    });
  }

  async publishPricingApprovalRequest(pricingId: string, approvalData: any) {
    await this.publishMessage('pricing.exchange', 'pricing.approval', {
      pricingId,
      approvalData,
      timestamp: new Date().toISOString(),
    });
  }
}
