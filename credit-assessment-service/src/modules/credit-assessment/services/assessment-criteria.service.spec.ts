import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentCriteriaService } from './assessment-criteria.service';
import { AssessmentCriteria, CriteriaType } from '../../../entities/assessment-criteria.entity';

describe('AssessmentCriteriaService', () => {
  let service: AssessmentCriteriaService;
  let repo: jest.Mocked<Repository<AssessmentCriteria>>;

  const makeCriteria = (overrides: Partial<AssessmentCriteria> = {}): AssessmentCriteria => ({
    id: 'crit-1',
    name: 'Income Ratio',
    description: 'desc',
    type: CriteriaType.INCOME_RATIO,
    operator: 'gte' as any,
    value: { minValue: 1.0, maxValue: 5.0 } as any,
    weight: 25,
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentCriteriaService,
        {
          provide: getRepositoryToken(AssessmentCriteria),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AssessmentCriteriaService);
    repo = module.get(getRepositoryToken(AssessmentCriteria));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create and save criteria', async () => {
      const data: Partial<AssessmentCriteria> = { name: 'X', type: CriteriaType.CREDIT_HISTORY } as any;
      repo.create.mockReturnValue(makeCriteria({ id: 'new' }));
      repo.save.mockResolvedValue(makeCriteria({ id: 'new' }));

      const result = await service.create(data);
      expect(repo.create).toHaveBeenCalledWith(data);
      expect(repo.save).toHaveBeenCalled();
      expect(result.id).toBe('new');
    });
  });

  describe('findAll', () => {
    it('should return active criteria ordered by weight desc', async () => {
      repo.find.mockResolvedValue([makeCriteria(), makeCriteria({ id: 'crit-2', weight: 10 })]);
      const result = await service.findAll();
      expect(repo.find).toHaveBeenCalledWith({ where: { isActive: true }, order: { weight: 'DESC' } });
      expect(result.length).toBe(2);
    });
  });

  describe('findByType', () => {
    it('should return active criteria by type ordered by weight desc', async () => {
      repo.find.mockResolvedValue([makeCriteria({ type: CriteriaType.CREDIT_HISTORY })]);
      const result = await service.findByType(CriteriaType.CREDIT_HISTORY);
      expect(repo.find).toHaveBeenCalledWith({ where: { type: CriteriaType.CREDIT_HISTORY, isActive: true }, order: { weight: 'DESC' } });
      expect(result[0].type).toBe(CriteriaType.CREDIT_HISTORY);
    });
  });

  describe('findOne', () => {
    it('should find by id', async () => {
      repo.findOne.mockResolvedValue(makeCriteria({ id: 'find' }));
      const result = await service.findOne('find');
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'find' } });
      expect(result.id).toBe('find');
    });
  });

  describe('update', () => {
    it('should merge and save', async () => {
      const existing = makeCriteria({ id: 'u', description: 'old' });
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockResolvedValue(makeCriteria({ id: 'u', description: 'new' }));

      const result = await service.update('u', { description: 'new' });
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'u' } });
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ description: 'new' }));
      expect(result.description).toBe('new');
    });
  });

  describe('remove', () => {
    it('should delete by id', async () => {
      repo.delete.mockResolvedValue({} as any);
      await service.remove('x');
      expect(repo.delete).toHaveBeenCalledWith('x');
    });
  });

  describe('deactivate', () => {
    it('should set isActive=false and save', async () => {
      const existing = makeCriteria({ id: 'd', isActive: true });
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation(async (entity: any) => entity);

      const result = await service.deactivate('d');
      expect(result.isActive).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    });
  });

  describe('getDefaultCriteria', () => {
    it('should return existing criteria when found', async () => {
      const existing = [makeCriteria({ id: 'a' })];
      jest.spyOn(service, 'findAll').mockResolvedValue(existing);

      const result = await service.getDefaultCriteria();
      expect(result).toBe(existing);
    });

    it('should create defaults when none exist', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([]).mockResolvedValueOnce([makeCriteria({ id: 'gen-1' })]);
      const createSpy = jest.spyOn(service, 'create').mockResolvedValue(makeCriteria({ id: 'gen-1' }));

      const result = await service.getDefaultCriteria();

      expect(createSpy).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});


