import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from '../../shared/rabbitmq/rabbitmq.service';
import { RedisService } from '../../shared/redis/redis.service';

export interface PaymentMessage {
  policyId: string;
  policyNumber: string;
  customerId: string;
  premiumAmount: string | number; // Can be string from RabbitMQ or number
  paymentDate: string;
  paymentStatus: string;
  transactionId: string;
  paymentMethod: string;
  coverageAmount: string | number; // Can be string from RabbitMQ or number
  type: string;
  effectiveDate: string;
  endDate: string;
  timestamp: string;
}

@Injectable()
export class WebhookService implements OnModuleInit {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.startPaymentConsumer();
  }

  private async startPaymentConsumer() {
    const queueName = this.configService.get('RABBITMQ_QUEUE_PAYMENT', 'order_paid');
    
    this.logger.log(`Starting payment consumer for queue: ${queueName}`);
    console.log('🎧 [WEBHOOK-MANAGER] Starting payment consumer...');
    console.log(`📡 [WEBHOOK-MANAGER] Listening to queue: ${queueName}`);
    console.log('⏳ [WEBHOOK-MANAGER] Waiting for payment messages...');
    
    await this.rabbitMQService.consumeMessage(queueName, async (message: PaymentMessage) => {
      console.log('📨 [WEBHOOK-MANAGER] Payment message received!');
      console.log(`💳 [WEBHOOK-MANAGER] Transaction ID: ${message.transactionId}`);
      console.log(`📄 [WEBHOOK-MANAGER] Policy Number: ${message.policyNumber}`);
      await this.processPayment(message);
    });
  }

  async processPayment(paymentData: PaymentMessage): Promise<void> {
    try {
      this.logger.log('🔄 Processing payment webhook...', {
        transactionId: paymentData.transactionId,
        policyNumber: paymentData.policyNumber,
        amount: paymentData.premiumAmount,
      });

      // Check if payment was already processed (idempotency)
      const processedKey = `payment_processed:${paymentData.transactionId}`;
      const alreadyProcessed = await this.redisService.exists(processedKey);
      
      if (alreadyProcessed) {
        this.logger.warn(`Payment already processed for transaction: ${paymentData.transactionId}`);
        return;
      }

      // Simulate payment processing
      await this.simulatePaymentTransaction(paymentData);

      // Mark as processed (idempotency)
      await this.redisService.set(processedKey, {
        processedAt: new Date().toISOString(),
        transactionId: paymentData.transactionId,
        policyNumber: paymentData.policyNumber,
      }, 86400); // 24 hours TTL

      this.logger.log('✅ Payment webhook processed successfully', {
        transactionId: paymentData.transactionId,
        policyNumber: paymentData.policyNumber,
      });

    } catch (error) {
      this.logger.error('❌ Error processing payment webhook:', error);
      throw error;
    }
  }

  private async simulatePaymentTransaction(paymentData: PaymentMessage): Promise<void> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Helper function to safely convert to number
    const toNumber = (value: string | number): number => {
      if (typeof value === 'number') return value;
      const parsed = parseFloat(value as string);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Console.log simulation as requested
    console.log('='.repeat(80));
    console.log('💳 PAYMENT TRANSACTION SIMULATION');
    console.log('='.repeat(80));
    console.log(`📋 Transaction ID: ${paymentData.transactionId}`);
    console.log(`📄 Policy Number: ${paymentData.policyNumber}`);
    console.log(`👤 Customer ID: ${paymentData.customerId}`);
    console.log(`💰 Amount: R$ ${toNumber(paymentData.premiumAmount).toFixed(2)}`);
    console.log(`💳 Payment Method: ${paymentData.paymentMethod}`);
    console.log(`📅 Payment Date: ${paymentData.paymentDate}`);
    console.log(`📅 Effective Date: ${paymentData.effectiveDate}`);
    console.log(`📅 End Date: ${paymentData.endDate}`);
    console.log(`🏷️  Policy Type: ${paymentData.type}`);
    console.log(`🛡️  Coverage Amount: R$ ${toNumber(paymentData.coverageAmount).toFixed(2)}`);
    console.log(`⏰ Timestamp: ${paymentData.timestamp}`);
    console.log('='.repeat(80));
    console.log('✅ TRANSACTION PROCESSED SUCCESSFULLY');
    console.log('='.repeat(80));

    // Simulate additional processing steps
    console.log('🔄 Processing additional steps...');
    console.log('📧 Sending confirmation email...');
    console.log('📱 Sending SMS notification...');
    console.log('📊 Updating analytics...');
    console.log('🔔 Triggering webhooks...');
    console.log('✅ All steps completed successfully!');
  }

  async getPaymentStatus(transactionId: string): Promise<any> {
    const processedKey = `payment_processed:${transactionId}`;
    return await this.redisService.get(processedKey);
  }

  async getServiceStats(): Promise<any> {
    // This could be enhanced to get real stats from Redis
    return {
      service: 'Webhook Manager Service',
      status: 'running',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}
