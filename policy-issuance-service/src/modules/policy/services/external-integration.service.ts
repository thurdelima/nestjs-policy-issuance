import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from '../../../shared/rabbitmq/rabbitmq.service';
import { Policy } from '../../../entities/policy.entity';

@Injectable()
export class ExternalIntegrationService {
  private readonly logger = new Logger(ExternalIntegrationService.name);

  constructor(
    private rabbitMQService: RabbitMQService,
    private configService: ConfigService,
  ) {}

  async requestCreditAssessment(policy: Policy): Promise<void> {
    try {
      const message = {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        customerId: policy.customerId,
        coverageAmount: policy.coverageAmount,
        type: policy.type,
        customerData: {
          cpf: 'customer-cpf',
          name: 'customer-name',
        },
        timestamp: new Date().toISOString(),
      };

      const queueName = this.configService.get('RABBITMQ_QUEUE_CREDIT_ASSESSMENT', 'credit.assessment.queue');
      await this.rabbitMQService.publishMessage(queueName, message);

      this.logger.log(`Credit assessment requested for policy ${policy.policyNumber}`);
    } catch (error) {
      this.logger.error(`Failed to request credit assessment for policy ${policy.policyNumber}:`, error);
      throw error;
    }
  }

  async requestPricing(policy: Policy): Promise<void> {
    try {
      const message = {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        type: policy.type,
        coverageAmount: policy.coverageAmount,
        coverageDetails: policy.coverageDetails,
        creditAssessment: policy.creditAssessment,
        startDate: policy.startDate,
        endDate: policy.endDate,
        timestamp: new Date().toISOString(),
      };

      const queueName = this.configService.get('RABBITMQ_QUEUE_PRICING', 'pricing.queue');
      await this.rabbitMQService.publishMessage(queueName, message);

      this.logger.log(`Pricing requested for policy ${policy.policyNumber}`);
    } catch (error) {
      this.logger.error(`Failed to request pricing for policy ${policy.policyNumber}:`, error);
      throw error;
    }
  }

  async notifyBillingService(policy: Policy): Promise<void> {
    try {
      const message = {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        customerId: policy.customerId,
        premiumAmount: policy.premiumAmount,
        paymentDate: policy.paymentDate,
        effectiveDate: policy.effectiveDate,
        endDate: policy.endDate,
        timestamp: new Date().toISOString(),
      };

      const queueName = this.configService.get('RABBITMQ_QUEUE_BILLING', 'billing.queue');
      await this.rabbitMQService.publishMessage(queueName, message);

      this.logger.log(`Billing service notified for policy ${policy.policyNumber}`);
    } catch (error) {
      this.logger.error(`Failed to notify billing service for policy ${policy.policyNumber}:`, error);
      throw error;
    }
  }

  async notifyAccountingService(policy: Policy): Promise<void> {
    try {
      const message = {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        customerId: policy.customerId,
        premiumAmount: policy.premiumAmount,
        coverageAmount: policy.coverageAmount,
        paymentDate: policy.paymentDate,
        effectiveDate: policy.effectiveDate,
        type: policy.type,
        timestamp: new Date().toISOString(),
      };

      const queueName = this.configService.get('RABBITMQ_QUEUE_ACCOUNTING', 'accounting.queue');
      await this.rabbitMQService.publishMessage(queueName, message);

      this.logger.log(`Accounting service notified for policy ${policy.policyNumber}`);
    } catch (error) {
      this.logger.error(`Failed to notify accounting service for policy ${policy.policyNumber}:`, error);
      throw error;
    }
  }

  async notifyPaymentService(policy: Policy, paymentData?: any): Promise<void> {
    try {
      const message = {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        customerId: policy.customerId,
        premiumAmount: policy.premiumAmount,
        paymentDate: policy.paymentDate,
        paymentStatus: 'paid',
        transactionId: paymentData?.transactionId || `TXN-${policy.id}-${Date.now()}`,
        paymentMethod: paymentData?.paymentMethod || 'credit_card',
        coverageAmount: policy.coverageAmount,
        type: policy.type,
        effectiveDate: policy.effectiveDate,
        endDate: policy.endDate,
        timestamp: new Date().toISOString(),
      };

      const queueName = this.configService.get('RABBITMQ_QUEUE_PAYMENT', 'order_paid');
      await this.rabbitMQService.publishMessage(queueName, message);

      this.logger.log(`Payment service notified for policy ${policy.policyNumber} - Transaction: ${message.transactionId}`);
    } catch (error) {
      this.logger.error(`Failed to notify payment service for policy ${policy.policyNumber}:`, error);
      throw error;
    }
  }

  async handleCreditAssessmentResponse(policyId: string, assessmentResult: any): Promise<void> {
    this.logger.log(`Received credit assessment response for policy ${policyId}`);
  }

  async handlePricingResponse(policyId: string, pricingResult: any): Promise<void> {
    this.logger.log(`Received pricing response for policy ${policyId}`);
  }
}
