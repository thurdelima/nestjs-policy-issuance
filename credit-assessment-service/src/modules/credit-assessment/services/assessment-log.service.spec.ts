import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentLogService } from './assessment-log.service';
import { AssessmentLog, LogAction, LogLevel } from '../../../entities/assessment-log.entity';

describe('AssessmentLogService', () => {
  let service: AssessmentLogService;
  let repo: jest.Mocked<Repository<AssessmentLog>>;

  const makeLog = (overrides: Partial<AssessmentLog> = {}): AssessmentLog => ({
    id: 'log-1',
    assessmentId: 'assess-1',
    action: LogAction.ASSESSMENT_STARTED,
    level: LogLevel.INFO,
    message: 'Test message',
    details: { test: 'data' },
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentLogService,
        {
          provide: getRepositoryToken(AssessmentLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AssessmentLogService);
    repo = module.get(getRepositoryToken(AssessmentLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLog', () => {
    it('should create and save log with all parameters', async () => {
      const logData = {
        assessmentId: 'assess-1',
        action: LogAction.ASSESSMENT_STARTED,
        level: LogLevel.INFO,
        message: 'Assessment started',
        details: { userId: 'user-123' },
      };

      repo.create.mockReturnValue(makeLog(logData));
      repo.save.mockResolvedValue(makeLog({ id: 'new-log', ...logData }));

      const result = await service.createLog(
        logData.assessmentId,
        logData.action,
        logData.level,
        logData.message,
        logData.details,
      );

      expect(repo.create).toHaveBeenCalledWith(logData);
      expect(repo.save).toHaveBeenCalled();
      expect(result.id).toBe('new-log');
      expect(result.assessmentId).toBe('assess-1');
      expect(result.action).toBe(LogAction.ASSESSMENT_STARTED);
      expect(result.level).toBe(LogLevel.INFO);
      expect(result.message).toBe('Assessment started');
      expect(result.details).toEqual({ userId: 'user-123' });
    });

    it('should create log without details when not provided', async () => {
      repo.create.mockReturnValue(makeLog());
      repo.save.mockResolvedValue(makeLog({ id: 'log-without-details' }));

      const result = await service.createLog(
        'assess-1',
        LogAction.ERROR_OCCURRED,
        LogLevel.ERROR,
        'Error occurred',
      );

      expect(repo.create).toHaveBeenCalledWith({
        assessmentId: 'assess-1',
        action: LogAction.ERROR_OCCURRED,
        level: LogLevel.ERROR,
        message: 'Error occurred',
        details: undefined,
      });
      expect(result.id).toBe('log-without-details');
    });
  });

  describe('getAssessmentLogs', () => {
    it('should return logs for assessment ordered by createdAt ASC', async () => {
      const logs = [
        makeLog({ id: 'log-1', createdAt: new Date('2025-01-01T10:00:00Z') }),
        makeLog({ id: 'log-2', createdAt: new Date('2025-01-01T11:00:00Z') }),
      ];
      repo.find.mockResolvedValue(logs);

      const result = await service.getAssessmentLogs('assess-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { assessmentId: 'assess-1' },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(logs);
      expect(result.length).toBe(2);
    });
  });

  describe('getLogsByAction', () => {
    it('should return logs by action ordered by createdAt DESC', async () => {
      const logs = [
        makeLog({ id: 'log-1', action: LogAction.SCORE_CALCULATED }),
        makeLog({ id: 'log-2', action: LogAction.SCORE_CALCULATED }),
      ];
      repo.find.mockResolvedValue(logs);

      const result = await service.getLogsByAction(LogAction.SCORE_CALCULATED);

      expect(repo.find).toHaveBeenCalledWith({
        where: { action: LogAction.SCORE_CALCULATED },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(logs);
      expect(result.every(log => log.action === LogAction.SCORE_CALCULATED)).toBe(true);
    });
  });

  describe('getLogsByLevel', () => {
    it('should return logs by level ordered by createdAt DESC', async () => {
      const logs = [
        makeLog({ id: 'log-1', level: LogLevel.ERROR }),
        makeLog({ id: 'log-2', level: LogLevel.ERROR }),
      ];
      repo.find.mockResolvedValue(logs);

      const result = await service.getLogsByLevel(LogLevel.ERROR);

      expect(repo.find).toHaveBeenCalledWith({
        where: { level: LogLevel.ERROR },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(logs);
      expect(result.every(log => log.level === LogLevel.ERROR)).toBe(true);
    });
  });

  describe('getErrorLogs', () => {
    it('should return error logs ordered by createdAt DESC', async () => {
      const errorLogs = [
        makeLog({ id: 'error-1', level: LogLevel.ERROR, message: 'Error 1' }),
        makeLog({ id: 'error-2', level: LogLevel.ERROR, message: 'Error 2' }),
      ];
      repo.find.mockResolvedValue(errorLogs);

      const result = await service.getErrorLogs();

      expect(repo.find).toHaveBeenCalledWith({
        where: { level: LogLevel.ERROR },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(errorLogs);
      expect(result.every(log => log.level === LogLevel.ERROR)).toBe(true);
    });
  });
});
