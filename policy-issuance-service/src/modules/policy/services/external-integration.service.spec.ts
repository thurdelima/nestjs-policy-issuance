import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExternalIntegrationService } from './external-integration.service';
import { RabbitMQService } from '../../../shared/rabbitmq/rabbitmq.service';
import { Policy, PolicyStatus, PolicyType, PaymentStatus } from '../../../entities/policy.entity';

describe('ExternalIntegrationService', () => {
  let service: ExternalIntegrationService;
  let rabbitMQService: jest.Mocked<RabbitMQService>;
  let configService: jest.Mocked<ConfigService>;

  const mockPolicy: Policy = {
    id: 'policy-uuid-1',
    policyNumber: 'FIA202501000001',
    type: PolicyType.FIANCA,
    customerId: 'customer-uuid-1',
    agentId: 'agent-uuid-1',
    coverageAmount: 100000,
    premiumAmount: 5000,
    status: PolicyStatus.ACTIVE,
    paymentStatus: PaymentStatus.PAID,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    effectiveDate: new Date('2025-01-01'),
    paymentDate: new Date('2025-01-01'),
    paymentDueDate: new Date('2025-01-08'),
    cancellationDate: null,
    cancellationReason: null,
    coverageDetails: {
      description: 'Test coverage',
      terms: ['Term 1'],
      exclusions: ['Exclusion 1'],
      conditions: ['Condition 1'],
    },
    creditAssessment: {
      score: 85,
      status: 'approved',
      details: { riskLevel: 'low' },
      assessedAt: new Date('2025-01-01'),
    },
    pricingDetails: {
      basePremium: 4000,
      taxes: 500,
      fees: 500,
      discounts: 0,
      totalPremium: 5000,
      currency: 'BRL',
    },
    metadata: {},
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  };

  const mockPaymentData = {
    transactionId: 'TXN-123456',
    paymentMethod: 'credit_card',
    amount: 5000,
  };

  beforeEach(async () => {
    const mockRabbitMQService = {
      publishMessage: jest.fn(),
      consumeMessage: jest.fn(),
      createExchange: jest.fn(),
      bindQueue: jest.fn(),
      getChannel: jest.fn(),
      getConnection: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalIntegrationService,
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ExternalIntegrationService>(ExternalIntegrationService);
    rabbitMQService = module.get(RabbitMQService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestCreditAssessment', () => {
    it('should request credit assessment successfully', async () => {
      // Arrange
      const expectedQueueName = 'credit.assessment.queue';
      const expectedMessage = {
        policyId: mockPolicy.id,
        policyNumber: mockPolicy.policyNumber,
        customerId: mockPolicy.customerId,
        coverageAmount: mockPolicy.coverageAmount,
        type: mockPolicy.type,
        customerData: {
          cpf: 'customer-cpf',
          name: 'customer-name',
        },
        timestamp: expect.any(String),
      };

      configService.get.mockReturnValue(expectedQueueName);
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.requestCreditAssessment(mockPolicy);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('RABBITMQ_QUEUE_CREDIT_ASSESSMENT', 'credit.assessment.queue');
      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith(expectedQueueName, expectedMessage);
    });

    it('should use default queue name when config is not set', async () => {
      // Arrange
      configService.get.mockReturnValue('credit.assessment.queue');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.requestCreditAssessment(mockPolicy);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('RABBITMQ_QUEUE_CREDIT_ASSESSMENT', 'credit.assessment.queue');
      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith('credit.assessment.queue', expect.any(Object));
    });

    it('should throw error when RabbitMQ publish fails', async () => {
      // Arrange
      const error = new Error('RabbitMQ publish failed');
      configService.get.mockReturnValue('credit.assessment.queue');
      rabbitMQService.publishMessage.mockRejectedValue(error);

      // Act & Assert
      await expect(service.requestCreditAssessment(mockPolicy)).rejects.toThrow('RabbitMQ publish failed');
    });

    it('should include correct timestamp in message', async () => {
      // Arrange
      const beforeCall = new Date();
      configService.get.mockReturnValue('credit.assessment.queue');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.requestCreditAssessment(mockPolicy);

      // Assert
      const afterCall = new Date();
      const publishedMessage = rabbitMQService.publishMessage.mock.calls[0][1];
      const messageTimestamp = new Date(publishedMessage.timestamp);
      
      expect(messageTimestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(messageTimestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
  });

  describe('requestPricing', () => {
    it('should request pricing successfully', async () => {
      // Arrange
      const expectedQueueName = 'pricing.queue';
      const expectedMessage = {
        policyId: mockPolicy.id,
        policyNumber: mockPolicy.policyNumber,
        type: mockPolicy.type,
        coverageAmount: mockPolicy.coverageAmount,
        coverageDetails: mockPolicy.coverageDetails,
        creditAssessment: mockPolicy.creditAssessment,
        startDate: mockPolicy.startDate,
        endDate: mockPolicy.endDate,
        timestamp: expect.any(String),
      };

      configService.get.mockReturnValue(expectedQueueName);
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.requestPricing(mockPolicy);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('RABBITMQ_QUEUE_PRICING', 'pricing.queue');
      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith(expectedQueueName, expectedMessage);
    });

    it('should use default queue name when config is not set', async () => {
      // Arrange
      configService.get.mockReturnValue('pricing.queue');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.requestPricing(mockPolicy);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('RABBITMQ_QUEUE_PRICING', 'pricing.queue');
      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith('pricing.queue', expect.any(Object));
    });

    it('should throw error when RabbitMQ publish fails', async () => {
      // Arrange
      const error = new Error('RabbitMQ publish failed');
      configService.get.mockReturnValue('pricing.queue');
      rabbitMQService.publishMessage.mockRejectedValue(error);

      // Act & Assert
      await expect(service.requestPricing(mockPolicy)).rejects.toThrow('RabbitMQ publish failed');
    });

    it('should include all required policy data in message', async () => {
      // Arrange
      configService.get.mockReturnValue('pricing.queue');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.requestPricing(mockPolicy);

      // Assert
      const publishedMessage = rabbitMQService.publishMessage.mock.calls[0][1];
      expect(publishedMessage.policyId).toBe(mockPolicy.id);
      expect(publishedMessage.policyNumber).toBe(mockPolicy.policyNumber);
      expect(publishedMessage.type).toBe(mockPolicy.type);
      expect(publishedMessage.coverageAmount).toBe(mockPolicy.coverageAmount);
      expect(publishedMessage.coverageDetails).toEqual(mockPolicy.coverageDetails);
      expect(publishedMessage.creditAssessment).toEqual(mockPolicy.creditAssessment);
      expect(publishedMessage.startDate).toBe(mockPolicy.startDate);
      expect(publishedMessage.endDate).toBe(mockPolicy.endDate);
    });
  });

  describe('notifyBillingService', () => {
    it('should notify billing service successfully', async () => {
      // Arrange
      const expectedQueueName = 'billing.queue';
      const expectedMessage = {
        policyId: mockPolicy.id,
        policyNumber: mockPolicy.policyNumber,
        customerId: mockPolicy.customerId,
        premiumAmount: mockPolicy.premiumAmount,
        paymentDate: mockPolicy.paymentDate,
        effectiveDate: mockPolicy.effectiveDate,
        endDate: mockPolicy.endDate,
        timestamp: expect.any(String),
      };

      configService.get.mockReturnValue(expectedQueueName);
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.notifyBillingService(mockPolicy);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('RABBITMQ_QUEUE_BILLING', 'billing.queue');
      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith(expectedQueueName, expectedMessage);
    });

    it('should use default queue name when config is not set', async () => {
      // Arrange
      configService.get.mockReturnValue('billing.queue');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.notifyBillingService(mockPolicy);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('RABBITMQ_QUEUE_BILLING', 'billing.queue');
      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith('billing.queue', expect.any(Object));
    });

    it('should throw error when RabbitMQ publish fails', async () => {
      // Arrange
      const error = new Error('RabbitMQ publish failed');
      configService.get.mockReturnValue('billing.queue');
      rabbitMQService.publishMessage.mockRejectedValue(error);

      // Act & Assert
      await expect(service.notifyBillingService(mockPolicy)).rejects.toThrow('RabbitMQ publish failed');
    });
  });

  describe('notifyAccountingService', () => {
    it('should notify accounting service successfully', async () => {
      // Arrange
      const expectedQueueName = 'accounting.queue';
      const expectedMessage = {
        policyId: mockPolicy.id,
        policyNumber: mockPolicy.policyNumber,
        customerId: mockPolicy.customerId,
        premiumAmount: mockPolicy.premiumAmount,
        coverageAmount: mockPolicy.coverageAmount,
        paymentDate: mockPolicy.paymentDate,
        effectiveDate: mockPolicy.effectiveDate,
        type: mockPolicy.type,
        timestamp: expect.any(String),
      };

      configService.get.mockReturnValue(expectedQueueName);
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.notifyAccountingService(mockPolicy);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('RABBITMQ_QUEUE_ACCOUNTING', 'accounting.queue');
      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith(expectedQueueName, expectedMessage);
    });

    it('should use default queue name when config is not set', async () => {
      // Arrange
      configService.get.mockReturnValue('accounting.queue');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.notifyAccountingService(mockPolicy);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('RABBITMQ_QUEUE_ACCOUNTING', 'accounting.queue');
      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith('accounting.queue', expect.any(Object));
    });

    it('should throw error when RabbitMQ publish fails', async () => {
      // Arrange
      const error = new Error('RabbitMQ publish failed');
      configService.get.mockReturnValue('accounting.queue');
      rabbitMQService.publishMessage.mockRejectedValue(error);

      // Act & Assert
      await expect(service.notifyAccountingService(mockPolicy)).rejects.toThrow('RabbitMQ publish failed');
    });
  });

  describe('notifyPaymentService', () => {
    it('should notify payment service successfully with payment data', async () => {
      // Arrange
      const expectedQueueName = 'order_paid';
      const expectedMessage = {
        policyId: mockPolicy.id,
        policyNumber: mockPolicy.policyNumber,
        customerId: mockPolicy.customerId,
        premiumAmount: mockPolicy.premiumAmount,
        paymentDate: mockPolicy.paymentDate,
        paymentStatus: 'paid',
        transactionId: mockPaymentData.transactionId,
        paymentMethod: mockPaymentData.paymentMethod,
        coverageAmount: mockPolicy.coverageAmount,
        type: mockPolicy.type,
        effectiveDate: mockPolicy.effectiveDate,
        endDate: mockPolicy.endDate,
        timestamp: expect.any(String),
      };

      configService.get.mockReturnValue(expectedQueueName);
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.notifyPaymentService(mockPolicy, mockPaymentData);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('RABBITMQ_QUEUE_PAYMENT', 'order_paid');
      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith(expectedQueueName, expectedMessage);
    });

    it('should notify payment service successfully without payment data', async () => {
      // Arrange
      const expectedQueueName = 'order_paid';
      const beforeCall = Date.now();
      
      configService.get.mockReturnValue(expectedQueueName);
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.notifyPaymentService(mockPolicy);

      // Assert
      const afterCall = Date.now();
      const publishedMessage = rabbitMQService.publishMessage.mock.calls[0][1];
      
      expect(publishedMessage.transactionId).toMatch(/^TXN-policy-uuid-1-\d+$/);
      expect(publishedMessage.paymentMethod).toBe('credit_card');
      
      // Verify timestamp is within expected range
      const messageTimestamp = new Date(publishedMessage.timestamp).getTime();
      expect(messageTimestamp).toBeGreaterThanOrEqual(beforeCall);
      expect(messageTimestamp).toBeLessThanOrEqual(afterCall);
    });

    it('should use default queue name when config is not set', async () => {
      // Arrange
      configService.get.mockReturnValue('order_paid');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.notifyPaymentService(mockPolicy, mockPaymentData);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('RABBITMQ_QUEUE_PAYMENT', 'order_paid');
      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith('order_paid', expect.any(Object));
    });

    it('should throw error when RabbitMQ publish fails', async () => {
      // Arrange
      const error = new Error('RabbitMQ publish failed');
      configService.get.mockReturnValue('order_paid');
      rabbitMQService.publishMessage.mockRejectedValue(error);

      // Act & Assert
      await expect(service.notifyPaymentService(mockPolicy, mockPaymentData)).rejects.toThrow('RabbitMQ publish failed');
    });

    it('should generate transaction ID when not provided', async () => {
      // Arrange
      configService.get.mockReturnValue('order_paid');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.notifyPaymentService(mockPolicy);

      // Assert
      const publishedMessage = rabbitMQService.publishMessage.mock.calls[0][1];
      expect(publishedMessage.transactionId).toMatch(/^TXN-policy-uuid-1-\d+$/);
    });

    it('should use provided transaction ID when available', async () => {
      // Arrange
      configService.get.mockReturnValue('order_paid');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.notifyPaymentService(mockPolicy, mockPaymentData);

      // Assert
      const publishedMessage = rabbitMQService.publishMessage.mock.calls[0][1];
      expect(publishedMessage.transactionId).toBe(mockPaymentData.transactionId);
    });

    it('should use default payment method when not provided', async () => {
      // Arrange
      configService.get.mockReturnValue('order_paid');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.notifyPaymentService(mockPolicy);

      // Assert
      const publishedMessage = rabbitMQService.publishMessage.mock.calls[0][1];
      expect(publishedMessage.paymentMethod).toBe('credit_card');
    });

    it('should use provided payment method when available', async () => {
      // Arrange
      configService.get.mockReturnValue('order_paid');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.notifyPaymentService(mockPolicy, mockPaymentData);

      // Assert
      const publishedMessage = rabbitMQService.publishMessage.mock.calls[0][1];
      expect(publishedMessage.paymentMethod).toBe(mockPaymentData.paymentMethod);
    });
  });

  describe('handleCreditAssessmentResponse', () => {
    it('should log credit assessment response', async () => {
      // Arrange
      const policyId = 'policy-uuid-1';
      const assessmentResult = { score: 85, approved: true };
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      // Act
      await service.handleCreditAssessmentResponse(policyId, assessmentResult);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(`Received credit assessment response for policy ${policyId}`);
    });

    it('should handle different assessment results', async () => {
      // Arrange
      const policyId = 'policy-uuid-1';
      const assessmentResult = { score: 45, approved: false, reason: 'High risk' };
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      // Act
      await service.handleCreditAssessmentResponse(policyId, assessmentResult);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(`Received credit assessment response for policy ${policyId}`);
    });
  });

  describe('handlePricingResponse', () => {
    it('should log pricing response', async () => {
      // Arrange
      const policyId = 'policy-uuid-1';
      const pricingResult = { totalPremium: 5000, breakdown: {} };
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      // Act
      await service.handlePricingResponse(policyId, pricingResult);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(`Received pricing response for policy ${policyId}`);
    });

    it('should handle different pricing results', async () => {
      // Arrange
      const policyId = 'policy-uuid-1';
      const pricingResult = { 
        totalPremium: 7500, 
        breakdown: { base: 6000, taxes: 1000, fees: 500 } 
      };
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      // Act
      await service.handlePricingResponse(policyId, pricingResult);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(`Received pricing response for policy ${policyId}`);
    });
  });

  describe('Error handling', () => {
    it('should propagate RabbitMQ errors in requestCreditAssessment', async () => {
      // Arrange
      const error = new Error('Connection failed');
      configService.get.mockReturnValue('credit.assessment.queue');
      rabbitMQService.publishMessage.mockRejectedValue(error);

      // Act & Assert
      await expect(service.requestCreditAssessment(mockPolicy)).rejects.toThrow('Connection failed');
    });

    it('should propagate RabbitMQ errors in requestPricing', async () => {
      // Arrange
      const error = new Error('Connection failed');
      configService.get.mockReturnValue('pricing.queue');
      rabbitMQService.publishMessage.mockRejectedValue(error);

      // Act & Assert
      await expect(service.requestPricing(mockPolicy)).rejects.toThrow('Connection failed');
    });

    it('should propagate RabbitMQ errors in notifyBillingService', async () => {
      // Arrange
      const error = new Error('Connection failed');
      configService.get.mockReturnValue('billing.queue');
      rabbitMQService.publishMessage.mockRejectedValue(error);

      // Act & Assert
      await expect(service.notifyBillingService(mockPolicy)).rejects.toThrow('Connection failed');
    });

    it('should propagate RabbitMQ errors in notifyAccountingService', async () => {
      // Arrange
      const error = new Error('Connection failed');
      configService.get.mockReturnValue('accounting.queue');
      rabbitMQService.publishMessage.mockRejectedValue(error);

      // Act & Assert
      await expect(service.notifyAccountingService(mockPolicy)).rejects.toThrow('Connection failed');
    });

    it('should propagate RabbitMQ errors in notifyPaymentService', async () => {
      // Arrange
      const error = new Error('Connection failed');
      configService.get.mockReturnValue('order_paid');
      rabbitMQService.publishMessage.mockRejectedValue(error);

      // Act & Assert
      await expect(service.notifyPaymentService(mockPolicy, mockPaymentData)).rejects.toThrow('Connection failed');
    });
  });

  describe('Message structure validation', () => {
    it('should include all required fields in credit assessment message', async () => {
      // Arrange
      configService.get.mockReturnValue('credit.assessment.queue');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.requestCreditAssessment(mockPolicy);

      // Assert
      const publishedMessage = rabbitMQService.publishMessage.mock.calls[0][1];
      expect(publishedMessage).toHaveProperty('policyId');
      expect(publishedMessage).toHaveProperty('policyNumber');
      expect(publishedMessage).toHaveProperty('customerId');
      expect(publishedMessage).toHaveProperty('coverageAmount');
      expect(publishedMessage).toHaveProperty('type');
      expect(publishedMessage).toHaveProperty('customerData');
      expect(publishedMessage).toHaveProperty('timestamp');
    });

    it('should include all required fields in pricing message', async () => {
      // Arrange
      configService.get.mockReturnValue('pricing.queue');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.requestPricing(mockPolicy);

      // Assert
      const publishedMessage = rabbitMQService.publishMessage.mock.calls[0][1];
      expect(publishedMessage).toHaveProperty('policyId');
      expect(publishedMessage).toHaveProperty('policyNumber');
      expect(publishedMessage).toHaveProperty('type');
      expect(publishedMessage).toHaveProperty('coverageAmount');
      expect(publishedMessage).toHaveProperty('coverageDetails');
      expect(publishedMessage).toHaveProperty('creditAssessment');
      expect(publishedMessage).toHaveProperty('startDate');
      expect(publishedMessage).toHaveProperty('endDate');
      expect(publishedMessage).toHaveProperty('timestamp');
    });

    it('should include all required fields in payment message', async () => {
      // Arrange
      configService.get.mockReturnValue('order_paid');
      rabbitMQService.publishMessage.mockResolvedValue(undefined);

      // Act
      await service.notifyPaymentService(mockPolicy, mockPaymentData);

      // Assert
      const publishedMessage = rabbitMQService.publishMessage.mock.calls[0][1];
      expect(publishedMessage).toHaveProperty('policyId');
      expect(publishedMessage).toHaveProperty('policyNumber');
      expect(publishedMessage).toHaveProperty('customerId');
      expect(publishedMessage).toHaveProperty('premiumAmount');
      expect(publishedMessage).toHaveProperty('paymentDate');
      expect(publishedMessage).toHaveProperty('paymentStatus');
      expect(publishedMessage).toHaveProperty('transactionId');
      expect(publishedMessage).toHaveProperty('paymentMethod');
      expect(publishedMessage).toHaveProperty('coverageAmount');
      expect(publishedMessage).toHaveProperty('type');
      expect(publishedMessage).toHaveProperty('effectiveDate');
      expect(publishedMessage).toHaveProperty('endDate');
      expect(publishedMessage).toHaveProperty('timestamp');
    });
  });
});
