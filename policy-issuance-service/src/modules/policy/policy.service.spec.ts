import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { Policy, PolicyStatus, PolicyType, PaymentStatus } from '../../entities/policy.entity';
import { PolicyEvent, EventType } from '../../entities/policy-event.entity';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { PolicyEventService } from './services/policy-event.service';
import { ExternalIntegrationService } from './services/external-integration.service';

describe('PolicyService', () => {
  let service: PolicyService;
  let policyRepository: jest.Mocked<Repository<Policy>>;
  let policyEventService: jest.Mocked<PolicyEventService>;
  let externalIntegrationService: jest.Mocked<ExternalIntegrationService>;

  const mockPolicy: Policy = {
    id: 'policy-uuid-1',
    policyNumber: 'FIA202501000001',
    type: PolicyType.FIANCA,
    customerId: 'customer-uuid-1',
    agentId: 'agent-uuid-1',
    coverageAmount: 100000,
    premiumAmount: 5000,
    status: PolicyStatus.DRAFT,
    paymentStatus: PaymentStatus.PENDING,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    effectiveDate: null,
    paymentDate: null,
    paymentDueDate: null,
    cancellationDate: null,
    cancellationReason: null,
    coverageDetails: {
      description: 'Test coverage',
      terms: ['Term 1'],
      exclusions: ['Exclusion 1'],
      conditions: ['Condition 1'],
    },
    creditAssessment: null,
    pricingDetails: null,
    metadata: {},
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  };

  const mockCreatePolicyDto: CreatePolicyDto = {
    type: PolicyType.FIANCA,
    customerId: 'customer-uuid-1',
    coverageAmount: 100000,
    premiumAmount: 5000,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    coverageDetails: {
      description: 'Test coverage',
      terms: ['Term 1'],
      exclusions: ['Exclusion 1'],
      conditions: ['Condition 1'],
    },
    metadata: {},
  };

  const mockUpdatePolicyDto: UpdatePolicyDto = {
    status: PolicyStatus.ACTIVE,
  };

  beforeEach(async () => {
    const mockPolicyRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockPolicyEventService = {
      createEvent: jest.fn(),
      getPolicyEvents: jest.fn(),
    };

    const mockExternalIntegrationService = {
      requestCreditAssessment: jest.fn(),
      requestPricing: jest.fn(),
      notifyBillingService: jest.fn(),
      notifyAccountingService: jest.fn(),
      notifyPaymentService: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        {
          provide: getRepositoryToken(Policy),
          useValue: mockPolicyRepository,
        },
        {
          provide: PolicyEventService,
          useValue: mockPolicyEventService,
        },
        {
          provide: ExternalIntegrationService,
          useValue: mockExternalIntegrationService,
        },
      ],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
    policyRepository = module.get(getRepositoryToken(Policy));
    policyEventService = module.get(PolicyEventService);
    externalIntegrationService = module.get(ExternalIntegrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a policy successfully', async () => {
      // Arrange
      const agentId = 'agent-uuid-1';
      const expectedPolicy = { ...mockPolicy, agentId };
      
      policyRepository.create.mockReturnValue(expectedPolicy as any);
      policyRepository.save.mockResolvedValue(expectedPolicy as any);
      policyEventService.createEvent.mockResolvedValue(undefined);
      
      // Mock generatePolicyNumber by spying on the private method
      const generatePolicyNumberSpy = jest.spyOn(service as any, 'generatePolicyNumber')
        .mockResolvedValue('FIA202501000001');

      // Act
      const result = await service.create(mockCreatePolicyDto, agentId);

      // Assert
      expect(generatePolicyNumberSpy).toHaveBeenCalledWith(PolicyType.FIANCA);
      expect(policyRepository.create).toHaveBeenCalledWith({
        ...mockCreatePolicyDto,
        policyNumber: 'FIA202501000001',
        agentId,
        status: PolicyStatus.DRAFT,
      });
      expect(policyRepository.save).toHaveBeenCalledWith(expectedPolicy);
      expect(policyEventService.createEvent).toHaveBeenCalledWith(
        expectedPolicy.id,
        EventType.POLICY_CREATED,
        'Policy created successfully',
        { policyData: mockCreatePolicyDto },
      );
      expect(result).toEqual(expectedPolicy);
    });
  });

  describe('findAll', () => {
    it('should return policies with pagination', async () => {
      // Arrange
      const mockPolicies = [mockPolicy];
      const mockTotal = 1;
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockPolicies, mockTotal]),
      };
      
      policyRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.findAll(1, 10);

      // Assert
      expect(policyRepository.createQueryBuilder).toHaveBeenCalledWith('policy');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('policy.createdAt', 'DESC');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({ policies: mockPolicies, total: mockTotal });
    });

    it('should apply filters when provided', async () => {
      // Arrange
      const filters = {
        status: PolicyStatus.ACTIVE,
        type: PolicyType.FIANCA,
        customerId: 'customer-uuid-1',
        agentId: 'agent-uuid-1',
      };
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      
      policyRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      await service.findAll(1, 10, filters);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('policy.status = :status', { status: PolicyStatus.ACTIVE });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('policy.type = :type', { type: PolicyType.FIANCA });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('policy.customerId = :customerId', { customerId: 'customer-uuid-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('policy.agentId = :agentId', { agentId: 'agent-uuid-1' });
    });
  });

  describe('findOne', () => {
    it('should return a policy when found', async () => {
      // Arrange
      policyRepository.findOne.mockResolvedValue(mockPolicy as any);

      // Act
      const result = await service.findOne('policy-uuid-1');

      // Assert
      expect(policyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'policy-uuid-1' },
      });
      expect(result).toEqual(mockPolicy);
    });

    it('should throw NotFoundException when policy not found', async () => {
      // Arrange
      policyRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id')).rejects.toThrow('Policy not found');
    });
  });

  describe('findByPolicyNumber', () => {
    it('should return a policy when found by policy number', async () => {
      // Arrange
      policyRepository.findOne.mockResolvedValue(mockPolicy as any);

      // Act
      const result = await service.findByPolicyNumber('FIA202501000001');

      // Assert
      expect(policyRepository.findOne).toHaveBeenCalledWith({
        where: { policyNumber: 'FIA202501000001' },
      });
      expect(result).toEqual(mockPolicy);
    });

    it('should throw NotFoundException when policy not found by policy number', async () => {
      // Arrange
      policyRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByPolicyNumber('NON-EXISTENT')).rejects.toThrow(NotFoundException);
      await expect(service.findByPolicyNumber('NON-EXISTENT')).rejects.toThrow('Policy not found');
    });
  });

  describe('update', () => {
    it('should update a policy successfully', async () => {
      // Arrange
      const updatedPolicy = { ...mockPolicy, status: PolicyStatus.ACTIVE };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPolicy as any);
      policyRepository.save.mockResolvedValue(updatedPolicy as any);
      policyEventService.createEvent.mockResolvedValue(undefined);

      // Act
      const result = await service.update('policy-uuid-1', mockUpdatePolicyDto);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith('policy-uuid-1');
      expect(policyRepository.save).toHaveBeenCalledWith({ ...mockPolicy, ...mockUpdatePolicyDto });
      expect(policyEventService.createEvent).toHaveBeenCalledWith(
        'policy-uuid-1',
        EventType.POLICY_UPDATED,
        'Policy updated',
        { updateData: mockUpdatePolicyDto },
      );
      expect(result).toEqual(updatedPolicy);
    });

    it('should throw BadRequestException when trying to update active policy with non-cancellation status', async () => {
      // Arrange
      const activePolicy = { ...mockPolicy, status: PolicyStatus.ACTIVE };
      const invalidUpdateDto = { status: PolicyStatus.PENDING_PAYMENT };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(activePolicy as any);

      // Act & Assert
      await expect(service.update('policy-uuid-1', invalidUpdateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update('policy-uuid-1', invalidUpdateDto)).rejects.toThrow('Active policies can only be cancelled');
    });
  });

  describe('remove', () => {
    it('should remove a policy successfully', async () => {
      // Arrange
      const draftPolicy = { ...mockPolicy, status: PolicyStatus.DRAFT };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(draftPolicy as any);
      policyRepository.remove.mockResolvedValue(draftPolicy as any);

      // Act
      await service.remove('policy-uuid-1');

      // Assert
      expect(service.findOne).toHaveBeenCalledWith('policy-uuid-1');
      expect(policyRepository.remove).toHaveBeenCalledWith(draftPolicy);
    });

    it('should throw BadRequestException when trying to remove active policy', async () => {
      // Arrange
      const activePolicy = { ...mockPolicy, status: PolicyStatus.ACTIVE };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(activePolicy as any);

      // Act & Assert
      await expect(service.remove('policy-uuid-1')).rejects.toThrow(BadRequestException);
      await expect(service.remove('policy-uuid-1')).rejects.toThrow('Cannot delete active policy');
    });
  });

  describe('initiateCreditAssessment', () => {
    it('should initiate credit assessment successfully', async () => {
      // Arrange
      const draftPolicy = { ...mockPolicy, status: PolicyStatus.DRAFT };
      const updatedPolicy = { ...draftPolicy, status: PolicyStatus.PENDING_CREDIT_ASSESSMENT };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(draftPolicy as any);
      policyRepository.save.mockResolvedValue(updatedPolicy as any);
      policyEventService.createEvent.mockResolvedValue(undefined);
      externalIntegrationService.requestCreditAssessment.mockResolvedValue(undefined);

      // Act
      const result = await service.initiateCreditAssessment('policy-uuid-1');

      // Assert
      expect(service.findOne).toHaveBeenCalledWith('policy-uuid-1');
      expect(policyRepository.save).toHaveBeenCalledWith({ ...draftPolicy, status: PolicyStatus.PENDING_CREDIT_ASSESSMENT });
      expect(policyEventService.createEvent).toHaveBeenCalledWith(
        'policy-uuid-1',
        EventType.CREDIT_ASSESSMENT_REQUESTED,
        'Credit assessment requested',
        { policyId: 'policy-uuid-1' },
      );
      expect(externalIntegrationService.requestCreditAssessment).toHaveBeenCalledWith(draftPolicy);
      expect(result).toEqual(updatedPolicy);
    });

    it('should throw BadRequestException when policy is not in draft status', async () => {
      // Arrange
      const activePolicy = { ...mockPolicy, status: PolicyStatus.ACTIVE };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(activePolicy as any);

      // Act & Assert
      await expect(service.initiateCreditAssessment('policy-uuid-1')).rejects.toThrow(BadRequestException);
      await expect(service.initiateCreditAssessment('policy-uuid-1')).rejects.toThrow('Only draft policies can initiate credit assessment');
    });
  });

  describe('completeCreditAssessment', () => {
    it('should complete credit assessment successfully', async () => {
      // Arrange
      const pendingPolicy = { ...mockPolicy, status: PolicyStatus.PENDING_CREDIT_ASSESSMENT };
      const updatedPolicy = { 
        ...pendingPolicy, 
        status: PolicyStatus.PENDING_PRICING,
        creditAssessment: { score: 85, approved: true }
      };
      const assessmentResult = { score: 85, approved: true };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(pendingPolicy as any);
      policyRepository.save.mockResolvedValue(updatedPolicy as any);
      policyEventService.createEvent.mockResolvedValue(undefined);
      externalIntegrationService.requestPricing.mockResolvedValue(undefined);

      // Act
      const result = await service.completeCreditAssessment('policy-uuid-1', assessmentResult);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith('policy-uuid-1');
      expect(policyRepository.save).toHaveBeenCalledWith({
        ...pendingPolicy,
        creditAssessment: assessmentResult,
        status: PolicyStatus.PENDING_PRICING,
      });
      expect(policyEventService.createEvent).toHaveBeenCalledWith(
        'policy-uuid-1',
        EventType.CREDIT_ASSESSMENT_COMPLETED,
        'Credit assessment completed',
        { assessmentResult },
      );
      expect(externalIntegrationService.requestPricing).toHaveBeenCalledWith(updatedPolicy);
      expect(result).toEqual(updatedPolicy);
    });

    it('should throw BadRequestException when policy is not in credit assessment status', async () => {
      // Arrange
      const draftPolicy = { ...mockPolicy, status: PolicyStatus.DRAFT };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(draftPolicy as any);

      // Act & Assert
      await expect(service.completeCreditAssessment('policy-uuid-1', {})).rejects.toThrow(BadRequestException);
      await expect(service.completeCreditAssessment('policy-uuid-1', {})).rejects.toThrow('Policy is not in credit assessment status');
    });
  });

  describe('completePricing', () => {
    it('should complete pricing successfully', async () => {
      // Arrange
      const pendingPolicy = { ...mockPolicy, status: PolicyStatus.PENDING_PRICING };
      const pricingResult = { totalPremium: 5000, breakdown: {} };
      const updatedPolicy = { 
        ...pendingPolicy, 
        status: PolicyStatus.PENDING_PAYMENT,
        pricingDetails: pricingResult,
        premiumAmount: 5000,
        paymentDueDate: expect.any(Date)
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(pendingPolicy as any);
      policyRepository.save.mockResolvedValue(updatedPolicy as any);
      policyEventService.createEvent.mockResolvedValue(undefined);

      // Act
      const result = await service.completePricing('policy-uuid-1', pricingResult);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith('policy-uuid-1');
      expect(policyRepository.save).toHaveBeenCalledWith({
        ...pendingPolicy,
        pricingDetails: pricingResult,
        premiumAmount: 5000,
        status: PolicyStatus.PENDING_PAYMENT,
        paymentDueDate: expect.any(Date),
      });
      expect(policyEventService.createEvent).toHaveBeenCalledWith(
        'policy-uuid-1',
        EventType.PRICING_COMPLETED,
        'Pricing completed',
        { pricingResult },
      );
      expect(result).toEqual(updatedPolicy);
    });

    it('should throw BadRequestException when policy is not in pricing status', async () => {
      // Arrange
      const draftPolicy = { ...mockPolicy, status: PolicyStatus.DRAFT };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(draftPolicy as any);

      // Act & Assert
      await expect(service.completePricing('policy-uuid-1', {})).rejects.toThrow(BadRequestException);
      await expect(service.completePricing('policy-uuid-1', {})).rejects.toThrow('Policy is not in pricing status');
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully for pending payment status', async () => {
      // Arrange
      const pendingPolicy = { ...mockPolicy, status: PolicyStatus.PENDING_PAYMENT };
      const paymentData = { amount: 5000, method: 'credit_card' };
      const updatedPolicy = { 
        ...pendingPolicy, 
        status: PolicyStatus.ACTIVE,
        paymentStatus: PaymentStatus.PAID,
        paymentDate: expect.any(Date),
        effectiveDate: expect.any(Date)
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(pendingPolicy as any);
      policyRepository.save.mockResolvedValue(updatedPolicy as any);
      policyEventService.createEvent.mockResolvedValue(undefined);
      externalIntegrationService.notifyBillingService.mockResolvedValue(undefined);
      externalIntegrationService.notifyAccountingService.mockResolvedValue(undefined);
      externalIntegrationService.notifyPaymentService.mockResolvedValue(undefined);

      // Act
      const result = await service.processPayment('policy-uuid-1', paymentData);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith('policy-uuid-1');
      expect(policyRepository.save).toHaveBeenCalledWith({
        ...pendingPolicy,
        paymentStatus: PaymentStatus.PAID,
        paymentDate: expect.any(Date),
        status: PolicyStatus.ACTIVE,
        effectiveDate: expect.any(Date),
      });
      expect(policyEventService.createEvent).toHaveBeenCalledWith(
        'policy-uuid-1',
        EventType.PAYMENT_PROCESSED,
        'Payment processed successfully',
        { paymentData },
      );
      expect(externalIntegrationService.notifyBillingService).toHaveBeenCalledWith(updatedPolicy);
      expect(externalIntegrationService.notifyAccountingService).toHaveBeenCalledWith(updatedPolicy);
      expect(externalIntegrationService.notifyPaymentService).toHaveBeenCalledWith(updatedPolicy, paymentData);
      expect(result).toEqual(updatedPolicy);
    });

    it('should process payment successfully for draft status', async () => {
      // Arrange
      const draftPolicy = { ...mockPolicy, status: PolicyStatus.DRAFT };
      const paymentData = { amount: 5000, method: 'credit_card' };
      const updatedPolicy = { 
        ...draftPolicy, 
        status: PolicyStatus.ACTIVE,
        paymentStatus: PaymentStatus.PAID,
        paymentDate: expect.any(Date),
        effectiveDate: expect.any(Date)
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(draftPolicy as any);
      policyRepository.save.mockResolvedValue(updatedPolicy as any);
      policyEventService.createEvent.mockResolvedValue(undefined);
      externalIntegrationService.notifyBillingService.mockResolvedValue(undefined);
      externalIntegrationService.notifyAccountingService.mockResolvedValue(undefined);
      externalIntegrationService.notifyPaymentService.mockResolvedValue(undefined);

      // Act
      const result = await service.processPayment('policy-uuid-1', paymentData);

      // Assert
      expect(result).toEqual(updatedPolicy);
    });

    it('should throw BadRequestException when policy is not in valid status for payment', async () => {
      // Arrange
      const activePolicy = { ...mockPolicy, status: PolicyStatus.ACTIVE };
      const paymentData = { amount: 5000, method: 'credit_card' };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(activePolicy as any);

      // Act & Assert
      await expect(service.processPayment('policy-uuid-1', paymentData)).rejects.toThrow(BadRequestException);
      await expect(service.processPayment('policy-uuid-1', paymentData)).rejects.toThrow('Policy is not in payment pending status or draft status');
    });
  });

  describe('cancelPolicy', () => {
    it('should cancel policy successfully', async () => {
      // Arrange
      const activePolicy = { ...mockPolicy, status: PolicyStatus.ACTIVE };
      const cancelledPolicy = { 
        ...activePolicy, 
        status: PolicyStatus.CANCELLED,
        cancellationDate: expect.any(Date),
        cancellationReason: 'Customer request'
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(activePolicy as any);
      policyRepository.save.mockResolvedValue(cancelledPolicy as any);
      policyEventService.createEvent.mockResolvedValue(undefined);

      // Act
      const result = await service.cancelPolicy('policy-uuid-1', 'Customer request');

      // Assert
      expect(service.findOne).toHaveBeenCalledWith('policy-uuid-1');
      expect(policyRepository.save).toHaveBeenCalledWith({
        ...activePolicy,
        status: PolicyStatus.CANCELLED,
        cancellationDate: expect.any(Date),
        cancellationReason: 'Customer request',
      });
      expect(policyEventService.createEvent).toHaveBeenCalledWith(
        'policy-uuid-1',
        EventType.POLICY_CANCELLED,
        'Policy cancelled',
        { reason: 'Customer request' },
      );
      expect(result).toEqual(cancelledPolicy);
    });

    it('should throw BadRequestException when policy is already cancelled', async () => {
      // Arrange
      const cancelledPolicy = { ...mockPolicy, status: PolicyStatus.CANCELLED };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(cancelledPolicy as any);

      // Act & Assert
      await expect(service.cancelPolicy('policy-uuid-1', 'Customer request')).rejects.toThrow(BadRequestException);
      await expect(service.cancelPolicy('policy-uuid-1', 'Customer request')).rejects.toThrow('Policy is already cancelled');
    });
  });

  describe('generatePolicyNumber', () => {
    it('should generate policy number for FIANCA type', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      
      policyRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await (service as any).generatePolicyNumber(PolicyType.FIANCA);

      // Assert
      expect(result).toMatch(/^FIA2025\d{2}000001$/);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('policy.policyNumber LIKE :pattern', { 
        pattern: expect.stringMatching(/^FIA2025\d{2}%$/) 
      });
    });

    it('should generate policy number for CAPITALIZACAO type', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      
      policyRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await (service as any).generatePolicyNumber(PolicyType.CAPITALIZACAO);

      // Assert
      expect(result).toMatch(/^CAP2025\d{2}000001$/);
    });

    it('should increment sequence when last policy exists', async () => {
      // Arrange
      const lastPolicy = { policyNumber: 'FIA202501000005' };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(lastPolicy),
      };
      
      policyRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await (service as any).generatePolicyNumber(PolicyType.FIANCA);

      // Assert
      expect(result).toBe('FIA202509000006'); // September 2025 (current month)
    });
  });

  describe('getPolicyEvents', () => {
    it('should return policy events', async () => {
      // Arrange
      const mockEvents = [
        { id: 'event-1', type: EventType.POLICY_CREATED },
        { id: 'event-2', type: EventType.POLICY_UPDATED },
      ];
      
      policyEventService.getPolicyEvents.mockResolvedValue(mockEvents as any);

      // Act
      const result = await service.getPolicyEvents('policy-uuid-1');

      // Assert
      expect(policyEventService.getPolicyEvents).toHaveBeenCalledWith('policy-uuid-1');
      expect(result).toEqual(mockEvents);
    });
  });
});
