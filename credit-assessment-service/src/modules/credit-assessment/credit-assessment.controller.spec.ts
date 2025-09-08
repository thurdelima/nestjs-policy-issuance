import { Test, TestingModule } from '@nestjs/testing';
import { CreditAssessmentController } from './credit-assessment.controller';
import { CreditAssessmentService } from './credit-assessment.service';
import { AssessmentStatus, AssessmentResult } from '../../entities/credit-assessment.entity';

describe('CreditAssessmentController', () => {
  let controller: CreditAssessmentController;
  let service: jest.Mocked<CreditAssessmentService>;

  const mockUser = { id: 'user-123', roles: ['admin'] } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditAssessmentController],
      providers: [
        {
          provide: CreditAssessmentService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findByPolicyId: jest.fn(),
            update: jest.fn(),
            processAssessment: jest.fn(),
            cancelAssessment: jest.fn(),
            getAssessmentLogs: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CreditAssessmentController>(CreditAssessmentController);
    service = module.get(CreditAssessmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: any = { policyId: 'policy-1', customerId: 'cust-1', requestedAmount: 10000 };
      service.create.mockResolvedValue({ id: 'assess-1' } as any);

      const spy = jest.spyOn(service, 'create');
      const result = await controller.create(dto, mockUser);

      expect(spy).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 'assess-1' });
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query params and filters', async () => {
      service.findAll.mockResolvedValue({ assessments: [], total: 0 } as any);

      const spy = jest.spyOn(service, 'findAll');
      const result = await controller.findAll(
        mockUser,
        2 as any,
        50 as any,
        AssessmentStatus.PENDING as any,
        AssessmentResult.APPROVED as any,
        'cust-123'
      );

      expect(spy).toHaveBeenCalledWith(2, 50, {
        status: AssessmentStatus.PENDING,
        result: AssessmentResult.APPROVED,
        customerId: 'cust-123',
      });
      expect(result).toEqual({ assessments: [], total: 0 });
    });

    it('should use default values when no query params provided', async () => {
      service.findAll.mockResolvedValue({ assessments: [], total: 0 } as any);

      await controller.findAll(mockUser, undefined as any, undefined as any, undefined as any, undefined as any, undefined as any);

      expect(service.findAll).toHaveBeenCalledWith(1, 10, {
        status: undefined,
        result: undefined,
        customerId: undefined,
      });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      service.findOne.mockResolvedValue({ id: 'assess-1' } as any);
      const spy = jest.spyOn(service, 'findOne');

      const result = await controller.findOne('assess-1');

      expect(spy).toHaveBeenCalledWith('assess-1');
      expect(result).toEqual({ id: 'assess-1' });
    });
  });

  describe('findByPolicyId', () => {
    it('should call service.findByPolicyId with policyId', async () => {
      service.findByPolicyId.mockResolvedValue({ id: 'assess-1', policyId: 'policy-1' } as any);
      const spy = jest.spyOn(service, 'findByPolicyId');

      const result = await controller.findByPolicyId('policy-1');

      expect(spy).toHaveBeenCalledWith('policy-1');
      expect(result).toEqual({ id: 'assess-1', policyId: 'policy-1' });
    });
  });

  describe('getAssessmentLogs', () => {
    it('should call service.getAssessmentLogs with id', async () => {
      service.getAssessmentLogs.mockResolvedValue([{ id: 'log-1' }] as any);
      const spy = jest.spyOn(service, 'getAssessmentLogs');

      const result = await controller.getAssessmentLogs('assess-1');

      expect(spy).toHaveBeenCalledWith('assess-1');
      expect(result).toEqual([{ id: 'log-1' }]);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      service.update.mockResolvedValue({ id: 'assess-1', requestedAmount: 15000 } as any);
      const spy = jest.spyOn(service, 'update');
      const dto: any = { requestedAmount: 15000 };

      const result = await controller.update('assess-1', dto);

      expect(spy).toHaveBeenCalledWith('assess-1', dto);
      expect(result).toEqual({ id: 'assess-1', requestedAmount: 15000 });
    });
  });

  describe('processAssessment', () => {
    it('should call service.processAssessment with id', async () => {
      service.processAssessment.mockResolvedValue({ id: 'assess-1', status: 'completed' } as any);
      const spy = jest.spyOn(service, 'processAssessment');

      const result = await controller.processAssessment('assess-1');

      expect(spy).toHaveBeenCalledWith('assess-1');
      expect(result).toEqual({ id: 'assess-1', status: 'completed' });
    });
  });

  describe('cancelAssessment', () => {
    it('should call service.cancelAssessment with id and reason', async () => {
      service.cancelAssessment.mockResolvedValue({ id: 'assess-1', status: 'cancelled' } as any);
      const spy = jest.spyOn(service, 'cancelAssessment');

      const result = await controller.cancelAssessment('assess-1', 'No longer needed');

      expect(spy).toHaveBeenCalledWith('assess-1', 'No longer needed');
      expect(result).toEqual({ id: 'assess-1', status: 'cancelled' });
    });
  });
});
