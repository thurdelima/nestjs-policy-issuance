import { Repository } from 'typeorm';
import { PricingHistoryService } from './pricing-history.service';
import { PricingHistory } from '../../../entities/pricing-history.entity';

describe('PricingHistoryService', () => {
  let service: PricingHistoryService;
  let pricingHistoryRepository: jest.Mocked<Repository<PricingHistory>>;

  const mockPricingHistory: PricingHistory = {
    id: 'history-123',
    pricingId: 'pricing-456',
    pricing: {} as any, // Mock da relação Pricing
    action: 'calculated',
    oldValues: { basePremium: 1000 },
    newValues: { basePremium: 1200 },
    changeReason: 'Risk adjustment',
    changedBy: 'user-789',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    get changeSummary() { return 'Premium calculated'; },
    get hasSignificantChange() { return true; },
  } as PricingHistory;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(() => {
    pricingHistoryRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    service = new PricingHistoryService(pricingHistoryRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logAction', () => {
    it('should create and save pricing history successfully', async () => {
      pricingHistoryRepository.create.mockReturnValue(mockPricingHistory);
      pricingHistoryRepository.save.mockResolvedValue(mockPricingHistory);
      const loggerLogSpy = jest.spyOn((service as any).logger, 'log');

      const result = await service.logAction(
        'pricing-456',
        'calculated',
        { basePremium: 1000 },
        { basePremium: 1200 },
        'Risk adjustment',
        'user-789'
      );

      expect(pricingHistoryRepository.create).toHaveBeenCalledWith({
        pricingId: 'pricing-456',
        action: 'calculated',
        oldValues: { basePremium: 1000 },
        newValues: { basePremium: 1200 },
        changeReason: 'Risk adjustment',
        changedBy: 'user-789',
      });
      expect(pricingHistoryRepository.save).toHaveBeenCalledWith(mockPricingHistory);
      expect(loggerLogSpy).toHaveBeenCalledWith('History logged for pricing pricing-456: calculated');
      expect(result).toBe(mockPricingHistory);
    });

    it('should create history without changedBy when not provided', async () => {
      pricingHistoryRepository.create.mockReturnValue(mockPricingHistory);
      pricingHistoryRepository.save.mockResolvedValue(mockPricingHistory);

      await service.logAction(
        'pricing-456',
        'created',
        null,
        { basePremium: 1000 },
        'Initial creation'
      );

      expect(pricingHistoryRepository.create).toHaveBeenCalledWith({
        pricingId: 'pricing-456',
        action: 'created',
        oldValues: null,
        newValues: { basePremium: 1000 },
        changeReason: 'Initial creation',
        changedBy: undefined,
      });
    });

    it('should throw and log error when save fails', async () => {
      const saveError = new Error('Database error');
      pricingHistoryRepository.create.mockReturnValue(mockPricingHistory);
      pricingHistoryRepository.save.mockRejectedValue(saveError);
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      await expect(service.logAction(
        'pricing-456',
        'calculated',
        { basePremium: 1000 },
        { basePremium: 1200 },
        'Risk adjustment'
      )).rejects.toThrow('Database error');

      expect(loggerErrorSpy).toHaveBeenCalledWith('Error logging pricing history:', saveError);
    });
  });

  describe('getPricingHistory', () => {
    it('should return paginated pricing history with default pagination', async () => {
      const mockData = [mockPricingHistory];
      const mockTotal = 1;
      pricingHistoryRepository.findAndCount.mockResolvedValue([mockData, mockTotal]);

      const result = await service.getPricingHistory('pricing-456');

      expect(pricingHistoryRepository.findAndCount).toHaveBeenCalledWith({
        where: { pricingId: 'pricing-456' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        data: mockData,
        total: mockTotal,
        page: 1,
        limit: 10,
      });
    });

    it('should return paginated pricing history with custom pagination', async () => {
      const mockData = [mockPricingHistory];
      const mockTotal = 25;
      pricingHistoryRepository.findAndCount.mockResolvedValue([mockData, mockTotal]);

      const result = await service.getPricingHistory('pricing-456', 2, 5);

      expect(pricingHistoryRepository.findAndCount).toHaveBeenCalledWith({
        where: { pricingId: 'pricing-456' },
        order: { createdAt: 'DESC' },
        skip: 5, // (page - 1) * limit = (2 - 1) * 5
        take: 5,
      });
      expect(result).toEqual({
        data: mockData,
        total: mockTotal,
        page: 2,
        limit: 5,
      });
    });
  });

  describe('getHistoryByAction', () => {
    it('should return paginated history filtered by action', async () => {
      const mockData = [mockPricingHistory];
      const mockTotal = 1;
      pricingHistoryRepository.findAndCount.mockResolvedValue([mockData, mockTotal]);

      const result = await service.getHistoryByAction('calculated', 1, 10);

      expect(pricingHistoryRepository.findAndCount).toHaveBeenCalledWith({
        where: { action: 'calculated' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        data: mockData,
        total: mockTotal,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getHistoryByUser', () => {
    it('should return paginated history filtered by user', async () => {
      const mockData = [mockPricingHistory];
      const mockTotal = 1;
      pricingHistoryRepository.findAndCount.mockResolvedValue([mockData, mockTotal]);

      const result = await service.getHistoryByUser('user-789', 1, 10);

      expect(pricingHistoryRepository.findAndCount).toHaveBeenCalledWith({
        where: { changedBy: 'user-789' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        data: mockData,
        total: mockTotal,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getRecentHistory', () => {
    it('should return recent history using query builder with default days', async () => {
      const mockData = [mockPricingHistory];
      const mockTotal = 1;
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockData, mockTotal]);

      const result = await service.getRecentHistory();

      expect(pricingHistoryRepository.createQueryBuilder).toHaveBeenCalledWith('history');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('history.createdAt >= :since', expect.objectContaining({
        since: expect.any(Date),
      }));
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('history.createdAt', 'DESC');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        data: mockData,
        total: mockTotal,
        page: 1,
        limit: 10,
      });
    });

    it('should return recent history with custom days and pagination', async () => {
      const mockData = [mockPricingHistory];
      const mockTotal = 1;
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockData, mockTotal]);

      const result = await service.getRecentHistory(30, 2, 5);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (page - 1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(result).toEqual({
        data: mockData,
        total: mockTotal,
        page: 2,
        limit: 5,
      });
    });

    it('should calculate correct date for recent history', async () => {
      const mockData = [mockPricingHistory];
      const mockTotal = 1;
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockData, mockTotal]);
      
      const originalDate = Date;
      const mockDate = new Date('2025-01-15T12:00:00Z');
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = originalDate.now;

      await service.getRecentHistory(7);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('history.createdAt >= :since', {
        since: new Date('2025-01-08T12:00:00Z'), // 7 days before
      });

      global.Date = originalDate;
    });
  });

  describe('getSignificantChanges', () => {
    it('should return only significant changes with calculated action', async () => {
      const mockData = [
        { ...mockPricingHistory, get hasSignificantChange() { return true; }, get changeSummary() { return 'Premium calculated'; } },
        { ...mockPricingHistory, id: 'history-456', get hasSignificantChange() { return false; }, get changeSummary() { return 'Premium calculated'; } },
        { ...mockPricingHistory, id: 'history-789', get hasSignificantChange() { return true; }, get changeSummary() { return 'Premium calculated'; } },
      ];
      const mockTotal = 3;
      pricingHistoryRepository.findAndCount.mockResolvedValue([mockData, mockTotal]);

      const result = await service.getSignificantChanges();

      expect(pricingHistoryRepository.findAndCount).toHaveBeenCalledWith({
        where: { action: 'calculated' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });

      const expectedSignificantChanges = mockData.filter(h => h.hasSignificantChange);
      expect(result).toEqual({
        data: expectedSignificantChanges,
        total: expectedSignificantChanges.length,
        page: 1,
        limit: 10,
      });
    });

    it('should return empty array when no significant changes found', async () => {
      const mockData = [
        { ...mockPricingHistory, get hasSignificantChange() { return false; }, get changeSummary() { return 'Premium calculated'; } },
        { ...mockPricingHistory, id: 'history-456', get hasSignificantChange() { return false; }, get changeSummary() { return 'Premium calculated'; } },
      ];
      const mockTotal = 2;
      pricingHistoryRepository.findAndCount.mockResolvedValue([mockData, mockTotal]);

      const result = await service.getSignificantChanges();

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });
    });
  });
});
