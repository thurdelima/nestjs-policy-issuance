import { Test, TestingModule } from '@nestjs/testing';
import { PolicyController } from './policy.controller';
import { PolicyService } from './policy.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { PolicyStatus, PolicyType, PaymentStatus } from '../../entities/policy.entity';
import { User } from '../../auth/decorators/current-user.decorator';

describe('PolicyController', () => {
  let controller: PolicyController;
  let policyService: jest.Mocked<PolicyService>;

  const mockUser: User = {
    id: 'user-uuid-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
    status: 'active',
  };

  const mockAgentUser: User = {
    id: 'agent-uuid-1',
    name: 'Test Agent',
    email: 'agent@example.com',
    role: 'agent',
    status: 'active',
  };

  const mockCustomerUser: User = {
    id: 'customer-uuid-1',
    name: 'Test Customer',
    email: 'customer@example.com',
    role: 'customer',
    status: 'active',
  };

  const mockPolicy = {
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

  const mockPoliciesResponse = {
    policies: [mockPolicy],
    total: 1,
  };

  const mockPolicyEvents = [
    {
      id: 'event-1',
      policyId: 'policy-uuid-1',
      eventType: 'policy_created',
      description: 'Policy created successfully',
      metadata: {},
      createdAt: new Date('2025-01-01T00:00:00Z'),
    },
  ];

  beforeEach(async () => {
    const mockPolicyService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPolicyNumber: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      initiateCreditAssessment: jest.fn(),
      processPayment: jest.fn(),
      cancelPolicy: jest.fn(),
      getPolicyEvents: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PolicyController],
      providers: [
        {
          provide: PolicyService,
          useValue: mockPolicyService,
        },
      ],
    }).compile();

    controller = module.get<PolicyController>(PolicyController);
    policyService = module.get(PolicyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a policy successfully', async () => {
      // Arrange
      policyService.create.mockResolvedValue(mockPolicy as any);

      // Act
      const result = await controller.create(mockCreatePolicyDto, mockUser);

      // Assert
      expect(policyService.create).toHaveBeenCalledWith(mockCreatePolicyDto, mockUser.id);
      expect(result).toEqual(mockPolicy);
    });

    it('should create a policy with agent user', async () => {
      // Arrange
      policyService.create.mockResolvedValue(mockPolicy as any);

      // Act
      const result = await controller.create(mockCreatePolicyDto, mockAgentUser);

      // Assert
      expect(policyService.create).toHaveBeenCalledWith(mockCreatePolicyDto, mockAgentUser.id);
      expect(result).toEqual(mockPolicy);
    });
  });

  describe('findAll', () => {
    it('should return all policies for admin user', async () => {
      // Arrange
      policyService.findAll.mockResolvedValue(mockPoliciesResponse);

      // Act
      const result = await controller.findAll(mockUser, 1, 10, PolicyStatus.DRAFT, PolicyType.FIANCA, 'customer-uuid-1');

      // Assert
      expect(policyService.findAll).toHaveBeenCalledWith(1, 10, {
        status: PolicyStatus.DRAFT,
        type: PolicyType.FIANCA,
        customerId: 'customer-uuid-1',
      });
      expect(result).toEqual(mockPoliciesResponse);
    });

    it('should return filtered policies for agent user (only their own)', async () => {
      // Arrange
      policyService.findAll.mockResolvedValue(mockPoliciesResponse);

      // Act
      const result = await controller.findAll(mockAgentUser, 1, 10, PolicyStatus.DRAFT, PolicyType.FIANCA, 'customer-uuid-1');

      // Assert
      expect(policyService.findAll).toHaveBeenCalledWith(1, 10, {
        status: PolicyStatus.DRAFT,
        type: PolicyType.FIANCA,
        customerId: 'customer-uuid-1',
        agentId: mockAgentUser.id, // Agent can only see their own policies
      });
      expect(result).toEqual(mockPoliciesResponse);
    });

    it('should return policies with default pagination', async () => {
      // Arrange
      policyService.findAll.mockResolvedValue(mockPoliciesResponse);

      // Act
      const result = await controller.findAll(mockUser);

      // Assert
      expect(policyService.findAll).toHaveBeenCalledWith(1, 10, {});
      expect(result).toEqual(mockPoliciesResponse);
    });

    it('should return policies with custom pagination', async () => {
      // Arrange
      policyService.findAll.mockResolvedValue(mockPoliciesResponse);

      // Act
      const result = await controller.findAll(mockUser, 2, 20);

      // Assert
      expect(policyService.findAll).toHaveBeenCalledWith(2, 20, {});
      expect(result).toEqual(mockPoliciesResponse);
    });
  });

  describe('getMyPolicies', () => {
    it('should return current user policies', async () => {
      // Arrange
      policyService.findAll.mockResolvedValue(mockPoliciesResponse);

      // Act
      const result = await controller.getMyPolicies(1, 10, mockCustomerUser);

      // Assert
      expect(policyService.findAll).toHaveBeenCalledWith(1, 10, {
        customerId: mockCustomerUser.id,
      });
      expect(result).toEqual(mockPoliciesResponse);
    });

    it('should return current user policies with default pagination', async () => {
      // Arrange
      policyService.findAll.mockResolvedValue(mockPoliciesResponse);

      // Act
      const result = await controller.getMyPolicies(undefined, undefined, mockCustomerUser);

      // Assert
      expect(policyService.findAll).toHaveBeenCalledWith(1, 10, {
        customerId: mockCustomerUser.id,
      });
      expect(result).toEqual(mockPoliciesResponse);
    });
  });

  describe('findOne', () => {
    it('should return a policy by ID', async () => {
      // Arrange
      policyService.findOne.mockResolvedValue(mockPolicy as any);

      // Act
      const result = await controller.findOne('policy-uuid-1', mockUser);

      // Assert
      expect(policyService.findOne).toHaveBeenCalledWith('policy-uuid-1');
      expect(result).toEqual(mockPolicy);
    });
  });

  describe('findByPolicyNumber', () => {
    it('should return a policy by policy number', async () => {
      // Arrange
      policyService.findByPolicyNumber.mockResolvedValue(mockPolicy as any);

      // Act
      const result = await controller.findByPolicyNumber('FIA202501000001');

      // Assert
      expect(policyService.findByPolicyNumber).toHaveBeenCalledWith('FIA202501000001');
      expect(result).toEqual(mockPolicy);
    });
  });

  describe('getPolicyEvents', () => {
    it('should return policy events', async () => {
      // Arrange
      policyService.getPolicyEvents.mockResolvedValue(mockPolicyEvents as any);

      // Act
      const result = await controller.getPolicyEvents('policy-uuid-1');

      // Assert
      expect(policyService.getPolicyEvents).toHaveBeenCalledWith('policy-uuid-1');
      expect(result).toEqual(mockPolicyEvents);
    });
  });

  describe('update', () => {
    it('should update a policy successfully', async () => {
      // Arrange
      const updatedPolicy = { ...mockPolicy, status: PolicyStatus.ACTIVE };
      policyService.update.mockResolvedValue(updatedPolicy as any);

      // Act
      const result = await controller.update('policy-uuid-1', mockUpdatePolicyDto);

      // Assert
      expect(policyService.update).toHaveBeenCalledWith('policy-uuid-1', mockUpdatePolicyDto);
      expect(result).toEqual(updatedPolicy);
    });
  });

  describe('initiateCreditAssessment', () => {
    it('should initiate credit assessment successfully', async () => {
      // Arrange
      const policyWithAssessment = { ...mockPolicy, status: PolicyStatus.PENDING_CREDIT_ASSESSMENT };
      policyService.initiateCreditAssessment.mockResolvedValue(policyWithAssessment as any);

      // Act
      const result = await controller.initiateCreditAssessment('policy-uuid-1');

      // Assert
      expect(policyService.initiateCreditAssessment).toHaveBeenCalledWith('policy-uuid-1');
      expect(result).toEqual(policyWithAssessment);
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      // Arrange
      const paymentData = {
        amount: 5000,
        method: 'credit_card',
        transactionId: 'txn-123',
      };
      const paidPolicy = { ...mockPolicy, status: PolicyStatus.ACTIVE };
      policyService.processPayment.mockResolvedValue(paidPolicy as any);

      // Act
      const result = await controller.processPayment('policy-uuid-1', paymentData);

      // Assert
      expect(policyService.processPayment).toHaveBeenCalledWith('policy-uuid-1', paymentData);
      expect(result).toEqual(paidPolicy);
    });

    it('should process payment with different payment data', async () => {
      // Arrange
      const paymentData = {
        amount: 10000,
        method: 'pix',
        transactionId: 'txn-456',
        customerId: 'customer-uuid-1',
      };
      const paidPolicy = { ...mockPolicy, status: PolicyStatus.ACTIVE };
      policyService.processPayment.mockResolvedValue(paidPolicy as any);

      // Act
      const result = await controller.processPayment('policy-uuid-1', paymentData);

      // Assert
      expect(policyService.processPayment).toHaveBeenCalledWith('policy-uuid-1', paymentData);
      expect(result).toEqual(paidPolicy);
    });
  });

  describe('cancelPolicy', () => {
    it('should cancel policy successfully', async () => {
      // Arrange
      const cancellationReason = 'Customer request';
      const cancelledPolicy = { ...mockPolicy, status: PolicyStatus.CANCELLED };
      policyService.cancelPolicy.mockResolvedValue(cancelledPolicy as any);

      // Act
      const result = await controller.cancelPolicy('policy-uuid-1', cancellationReason);

      // Assert
      expect(policyService.cancelPolicy).toHaveBeenCalledWith('policy-uuid-1', cancellationReason);
      expect(result).toEqual(cancelledPolicy);
    });

    it('should cancel policy with different reason', async () => {
      // Arrange
      const cancellationReason = 'Non-payment';
      const cancelledPolicy = { ...mockPolicy, status: PolicyStatus.CANCELLED };
      policyService.cancelPolicy.mockResolvedValue(cancelledPolicy as any);

      // Act
      const result = await controller.cancelPolicy('policy-uuid-1', cancellationReason);

      // Assert
      expect(policyService.cancelPolicy).toHaveBeenCalledWith('policy-uuid-1', cancellationReason);
      expect(result).toEqual(cancelledPolicy);
    });
  });

  describe('remove', () => {
    it('should remove a policy successfully', async () => {
      // Arrange
      policyService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove('policy-uuid-1');

      // Assert
      expect(policyService.remove).toHaveBeenCalledWith('policy-uuid-1');
      expect(result).toBeUndefined();
    });
  });

  describe('Role-based access control', () => {
    it('should filter policies by agentId for agent role', async () => {
      // Arrange
      policyService.findAll.mockResolvedValue(mockPoliciesResponse);

      // Act
      await controller.findAll(mockAgentUser, 1, 10, PolicyStatus.DRAFT);

      // Assert
      expect(policyService.findAll).toHaveBeenCalledWith(1, 10, {
        status: PolicyStatus.DRAFT,
        agentId: mockAgentUser.id,
      });
    });

    it('should not filter by agentId for admin role', async () => {
      // Arrange
      policyService.findAll.mockResolvedValue(mockPoliciesResponse);

      // Act
      await controller.findAll(mockUser, 1, 10, PolicyStatus.DRAFT);

      // Assert
      expect(policyService.findAll).toHaveBeenCalledWith(1, 10, {
        status: PolicyStatus.DRAFT,
      });
    });
  });

  describe('Parameter validation', () => {
    it('should handle UUID validation in findOne', async () => {
      // Arrange
      policyService.findOne.mockResolvedValue(mockPolicy as any);

      // Act
      const result = await controller.findOne('policy-uuid-1', mockUser);

      // Assert
      expect(policyService.findOne).toHaveBeenCalledWith('policy-uuid-1');
      expect(result).toEqual(mockPolicy);
    });

    it('should handle UUID validation in update', async () => {
      // Arrange
      policyService.update.mockResolvedValue(mockPolicy as any);

      // Act
      const result = await controller.update('policy-uuid-1', mockUpdatePolicyDto);

      // Assert
      expect(policyService.update).toHaveBeenCalledWith('policy-uuid-1', mockUpdatePolicyDto);
      expect(result).toEqual(mockPolicy);
    });

    it('should handle UUID validation in remove', async () => {
      // Arrange
      policyService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove('policy-uuid-1');

      // Assert
      expect(policyService.remove).toHaveBeenCalledWith('policy-uuid-1');
      expect(result).toBeUndefined();
    });
  });

  describe('Query parameters', () => {
    it('should handle all query parameters in findAll', async () => {
      // Arrange
      policyService.findAll.mockResolvedValue(mockPoliciesResponse);

      // Act
      await controller.findAll(
        mockUser,
        2,
        20,
        PolicyStatus.ACTIVE,
        PolicyType.CAPITALIZACAO,
        'customer-uuid-2'
      );

      // Assert
      expect(policyService.findAll).toHaveBeenCalledWith(2, 20, {
        status: PolicyStatus.ACTIVE,
        type: PolicyType.CAPITALIZACAO,
        customerId: 'customer-uuid-2',
      });
    });

    it('should handle partial query parameters in findAll', async () => {
      // Arrange
      policyService.findAll.mockResolvedValue(mockPoliciesResponse);

      // Act
      await controller.findAll(mockUser, 1, 10, PolicyStatus.DRAFT);

      // Assert
      expect(policyService.findAll).toHaveBeenCalledWith(1, 10, {
        status: PolicyStatus.DRAFT,
      });
    });

    it('should handle no query parameters in findAll', async () => {
      // Arrange
      policyService.findAll.mockResolvedValue(mockPoliciesResponse);

      // Act
      await controller.findAll(mockUser);

      // Assert
      expect(policyService.findAll).toHaveBeenCalledWith(1, 10, {});
    });
  });

  describe('Error handling', () => {
    it('should propagate service errors in create', async () => {
      // Arrange
      const error = new Error('Service error');
      policyService.create.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.create(mockCreatePolicyDto, mockUser)).rejects.toThrow('Service error');
    });

    it('should propagate service errors in findAll', async () => {
      // Arrange
      const error = new Error('Service error');
      policyService.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findAll(mockUser)).rejects.toThrow('Service error');
    });

    it('should propagate service errors in findOne', async () => {
      // Arrange
      const error = new Error('Service error');
      policyService.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findOne('policy-uuid-1', mockUser)).rejects.toThrow('Service error');
    });

    it('should propagate service errors in update', async () => {
      // Arrange
      const error = new Error('Service error');
      policyService.update.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.update('policy-uuid-1', mockUpdatePolicyDto)).rejects.toThrow('Service error');
    });

    it('should propagate service errors in processPayment', async () => {
      // Arrange
      const error = new Error('Service error');
      policyService.processPayment.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.processPayment('policy-uuid-1', {})).rejects.toThrow('Service error');
    });
  });
});
