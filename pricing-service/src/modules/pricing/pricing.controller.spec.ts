import { Test, TestingModule } from '@nestjs/testing';
import { PricingController } from './pricing.controller';
import { PricingService } from './services/pricing.service';
import { PricingHistoryService } from './services/pricing-history.service';
import { PricingStatus } from '../../entities/pricing.entity';

describe('PricingController', () => {
  let controller: PricingController;
  let pricingService: jest.Mocked<PricingService>;
  let pricingHistoryService: jest.Mocked<PricingHistoryService>;

  const mockUser = { id: 'user-123', roles: ['admin'] } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricingController],
      providers: [
        {
          provide: PricingService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findByPolicyId: jest.fn(),
            update: jest.fn(),
            approve: jest.fn(),
            reject: jest.fn(),
            recalculate: jest.fn(),
            deactivate: jest.fn(),
          },
        },
        {
          provide: PricingHistoryService,
          useValue: {
            getPricingHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PricingController>(PricingController);
    pricingService = module.get(PricingService);
    pricingHistoryService = module.get(PricingHistoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.create with dto and user id', async () => {
      const dto: any = { policyId: 'policy-1', basePremium: 1000 };
      pricingService.create.mockResolvedValue({ id: 'pricing-1' } as any);

      const spy = jest.spyOn(pricingService, 'create');
      const result = await controller.create(dto, mockUser);

      expect(spy).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toEqual({ id: 'pricing-1' });
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query params', async () => {
      pricingService.findAll.mockResolvedValue({ data: [], total: 0 } as any);

      const spy = jest.spyOn(pricingService, 'findAll');
      const result = await controller.findAll(2 as any, 50 as any, PricingStatus.ACTIVE as any, 'policy-xyz');

      expect(spy).toHaveBeenCalledWith(2 as any, 50 as any, PricingStatus.ACTIVE as any, 'policy-xyz');
      expect(result).toEqual({ data: [], total: 0 });
    });

    it('should pass undefineds when no query params provided', async () => {
      pricingService.findAll.mockResolvedValue({ data: [], total: 0 } as any);

      await controller.findAll(undefined as any, undefined as any, undefined as any, undefined as any);

      expect(pricingService.findAll).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      pricingService.findOne.mockResolvedValue({ id: 'pricing-1' } as any);
      const spy = jest.spyOn(pricingService, 'findOne');

      const result = await controller.findOne('pricing-1');

      expect(spy).toHaveBeenCalledWith('pricing-1');
      expect(result).toEqual({ id: 'pricing-1' });
    });
  });

  describe('findByPolicyId', () => {
    it('should call service.findByPolicyId with policyId', async () => {
      pricingService.findByPolicyId.mockResolvedValue([{ id: 'pricing-1' }] as any);
      const spy = jest.spyOn(pricingService, 'findByPolicyId');

      const result = await controller.findByPolicyId('policy-1');

      expect(spy).toHaveBeenCalledWith('policy-1');
      expect(result).toEqual([{ id: 'pricing-1' }]);
    });
  });

  describe('update', () => {
    it('should call service.update with id, dto and user id', async () => {
      pricingService.update.mockResolvedValue({ id: 'pricing-1', basePremium: 1200 } as any);
      const spy = jest.spyOn(pricingService, 'update');
      const dto: any = { basePremium: 1200 };

      const result = await controller.update('pricing-1', dto, mockUser);

      expect(spy).toHaveBeenCalledWith('pricing-1', dto, mockUser.id);
      expect(result).toEqual({ id: 'pricing-1', basePremium: 1200 });
    });
  });

  describe('approve', () => {
    it('should call service.approve with id and user id', async () => {
      pricingService.approve.mockResolvedValue({ id: 'pricing-1', status: 'approved' } as any);
      const spy = jest.spyOn(pricingService, 'approve');

      const result = await controller.approve('pricing-1', mockUser);

      expect(spy).toHaveBeenCalledWith('pricing-1', mockUser.id);
      expect(result).toEqual({ id: 'pricing-1', status: 'approved' });
    });
  });

  describe('reject', () => {
    it('should call service.reject with id, reason and user id', async () => {
      pricingService.reject.mockResolvedValue({ id: 'pricing-1', status: 'rejected' } as any);
      const spy = jest.spyOn(pricingService, 'reject');

      const result = await controller.reject('pricing-1', 'Not eligible', mockUser);

      expect(spy).toHaveBeenCalledWith('pricing-1', 'Not eligible', mockUser.id);
      expect(result).toEqual({ id: 'pricing-1', status: 'rejected' });
    });
  });

  describe('recalculate', () => {
    it('should call service.recalculate with id and user id', async () => {
      pricingService.recalculate.mockResolvedValue({ id: 'pricing-1', totalPremium: 1234 } as any);
      const spy = jest.spyOn(pricingService, 'recalculate');

      const result = await controller.recalculate('pricing-1', mockUser);

      expect(spy).toHaveBeenCalledWith('pricing-1', mockUser.id);
      expect(result).toEqual({ id: 'pricing-1', totalPremium: 1234 });
    });
  });

  describe('deactivate', () => {
    it('should call service.deactivate with id and user id', async () => {
      pricingService.deactivate.mockResolvedValue({ id: 'pricing-1', status: 'inactive' } as any);
      const spy = jest.spyOn(pricingService, 'deactivate');

      const result = await controller.deactivate('pricing-1', mockUser);

      expect(spy).toHaveBeenCalledWith('pricing-1', mockUser.id);
      expect(result).toEqual({ id: 'pricing-1', status: 'inactive' });
    });
  });

  describe('getHistory', () => {
    it('should call historyService.getPricingHistory with id, page and limit', async () => {
      pricingHistoryService.getPricingHistory.mockResolvedValue({ data: [], total: 0 } as any);
      const spy = jest.spyOn(pricingHistoryService, 'getPricingHistory');

      const result = await controller.getHistory('pricing-1', 1 as any, 20 as any);

      expect(spy).toHaveBeenCalledWith('pricing-1', 1 as any, 20 as any);
      expect(result).toEqual({ data: [], total: 0 });
    });

    it('should handle undefined page and limit', async () => {
      pricingHistoryService.getPricingHistory.mockResolvedValue({ data: [], total: 0 } as any);

      await controller.getHistory('pricing-1', undefined as any, undefined as any);

      expect(pricingHistoryService.getPricingHistory).toHaveBeenCalledWith('pricing-1', undefined, undefined);
    });
  });
});


