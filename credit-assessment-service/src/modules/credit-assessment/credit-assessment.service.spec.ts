import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditAssessmentService } from './credit-assessment.service';
import { CreditAssessment, AssessmentStatus, AssessmentResult, RiskLevel } from '../../entities/credit-assessment.entity';
import { AssessmentLogService } from './services/assessment-log.service';
import { CreditScoringService } from './services/credit-scoring.service';
import { ExternalDataService } from './services/external-data.service';
import { RabbitMQService } from '../../shared/rabbitmq/rabbitmq.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CreditAssessmentService', () => {
  let service: CreditAssessmentService;
  let repo: jest.Mocked<Repository<CreditAssessment>>;
  let logService: jest.Mocked<AssessmentLogService>;
  let scoringService: jest.Mocked<CreditScoringService>;
  let externalService: jest.Mocked<ExternalDataService>;
  let rabbitService: jest.Mocked<RabbitMQService>;

  const makeAssessment = (overrides: Partial<CreditAssessment> = {}): CreditAssessment => ({
    id: 'assess-1',
    policyId: 'policy-1',
    customerId: 'cust-1',
    requestedAmount: 10000,
    status: AssessmentStatus.PENDING,
    result: null as any,
    creditScore: 0,
    riskLevel: RiskLevel.MEDIUM,
    assessmentCriteria: {} as any,
    externalData: {} as any,
    approvedAmount: undefined,
    interestRate: undefined,
    termMonths: undefined,
    rejectionReason: undefined,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditAssessmentService,
        { provide: getRepositoryToken(CreditAssessment), useValue: {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
          createQueryBuilder: jest.fn(),
        }},
        { provide: AssessmentLogService, useValue: {
          createLog: jest.fn(),
          getAssessmentLogs: jest.fn(),
        }},
        { provide: CreditScoringService, useValue: {
          calculateScore: jest.fn(),
        }},
        { provide: ExternalDataService, useValue: {
          gatherExternalData: jest.fn(),
        }},
        { provide: RabbitMQService, useValue: {
          publishMessage: jest.fn(),
        }},
      ],
    }).compile();

    service = module.get(CreditAssessmentService);
    repo = module.get(getRepositoryToken(CreditAssessment));
    logService = module.get(AssessmentLogService);
    scoringService = module.get(CreditScoringService);
    externalService = module.get(ExternalDataService);
    rabbitService = module.get(RabbitMQService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a new assessment and log', async () => {
      const dto: any = { policyId: 'policy-1', customerId: 'cust-1', requestedAmount: 10000 };
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(makeAssessment({ status: AssessmentStatus.PENDING }));
      repo.save.mockResolvedValue(makeAssessment({ id: 'assess-1' }));

      const result = await service.create(dto);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { policyId: dto.policyId } });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ ...dto, status: AssessmentStatus.PENDING }));
      expect(repo.save).toHaveBeenCalled();
      expect(logService.createLog).toHaveBeenCalledWith('assess-1', expect.any(String), expect.any(String), 'Credit assessment created', { assessmentData: dto });
      expect(result.id).toBe('assess-1');
    });

    it('should throw if assessment already exists', async () => {
      repo.findOne.mockResolvedValue(makeAssessment());
      await expect(service.create({ policyId: 'policy-1' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should filter and paginate results', async () => {
      const qb: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[makeAssessment()], 1]),
      };
      (repo.createQueryBuilder as any).mockReturnValue(qb);

      const result = await service.findAll(2, 5, { status: AssessmentStatus.PENDING, result: AssessmentResult.APPROVED, customerId: 'cust-1' });

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('assessment');
      expect(qb.andWhere).toHaveBeenCalledTimes(3);
      expect(qb.skip).toHaveBeenCalledWith((2 - 1) * 5);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return assessment when found', async () => {
      repo.findOne.mockResolvedValue(makeAssessment({ id: 'x' }));
      const result = await service.findOne('x');
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'x' } });
      expect(result.id).toBe('x');
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPolicyId', () => {
    it('should return by policy id', async () => {
      repo.findOne.mockResolvedValue(makeAssessment({ policyId: 'p' }));
      const result = await service.findByPolicyId('p');
      expect(repo.findOne).toHaveBeenCalledWith({ where: { policyId: 'p' } });
      expect(result.policyId).toBe('p');
    });

    it('should throw when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findByPolicyId('p')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update assessment and log', async () => {
      const existing = makeAssessment({ id: 'a' });
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockResolvedValue({ ...existing, requestedAmount: 5000 } as any);

      const result = await service.update('a', { requestedAmount: 5000 } as any);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'a' } });
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ requestedAmount: 5000 }));
      expect(logService.createLog).toHaveBeenCalledWith('a', expect.any(String), expect.any(String), 'Assessment updated', { updateData: { requestedAmount: 5000 } });
      expect(result.requestedAmount).toBe(5000);
    });
  });

  describe('processAssessment', () => {
    it('should process, complete and notify policy service', async () => {
      const assessment = makeAssessment({ id: 'a', status: AssessmentStatus.PENDING, requestedAmount: 10000, riskLevel: RiskLevel.LOW });
      repo.findOne.mockResolvedValue(assessment);
      repo.save.mockImplementation(async (entity: any) => entity);
      externalService.gatherExternalData.mockResolvedValue({ income: 5000 } as any);
      scoringService.calculateScore.mockResolvedValue({ score: 720, riskLevel: RiskLevel.LOW, criteria: { rule: 'ok' } } as any);
      const notifySpy = jest.spyOn<any, any>(service as any, 'notifyPolicyService').mockResolvedValue(undefined);

      const result = await service.processAssessment('a');

      expect(externalService.gatherExternalData).toHaveBeenCalled();
      expect(scoringService.calculateScore).toHaveBeenCalled();
      expect(result.status).toBe(AssessmentStatus.COMPLETED);
      expect(notifySpy).toHaveBeenCalled();
      expect(logService.createLog).toHaveBeenCalledWith('a', expect.any(String), expect.any(String), 'Assessment completed successfully', expect.any(Object));
    });

    it('should set FAILED and log on error', async () => {
      const assessment = makeAssessment({ id: 'a', status: AssessmentStatus.PENDING });
      repo.findOne.mockResolvedValue(assessment);
      repo.save.mockImplementation(async (entity: any) => entity);
      externalService.gatherExternalData.mockRejectedValue(new Error('ext err'));

      await expect(service.processAssessment('a')).rejects.toThrow('ext err');
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: AssessmentStatus.FAILED }));
      expect(logService.createLog).toHaveBeenCalledWith('a', expect.any(String), expect.any(String), 'Assessment failed', expect.objectContaining({ error: 'ext err' }));
    });

    it('should throw if not pending', async () => {
      const assessment = makeAssessment({ id: 'a', status: AssessmentStatus.COMPLETED });
      repo.findOne.mockResolvedValue(assessment);
      await expect(service.processAssessment('a')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelAssessment', () => {
    it('should cancel when not completed', async () => {
      const assessment = makeAssessment({ id: 'a', status: AssessmentStatus.IN_PROGRESS });
      repo.findOne.mockResolvedValue(assessment);
      repo.save.mockImplementation(async (entity: any) => entity);

      const result = await service.cancelAssessment('a', 'no need');

      expect(result.status).toBe(AssessmentStatus.CANCELLED);
      expect(result.rejectionReason).toBe('no need');
      expect(logService.createLog).toHaveBeenCalledWith('a', expect.any(String), expect.any(String), 'Assessment cancelled', { reason: 'no need' });
    });

    it('should throw when already completed', async () => {
      const assessment = makeAssessment({ id: 'a', status: AssessmentStatus.COMPLETED });
      repo.findOne.mockResolvedValue(assessment);
      await expect(service.cancelAssessment('a', 'reason')).rejects.toThrow(BadRequestException);
    });
  });
});


