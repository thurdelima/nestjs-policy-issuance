import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentLog, LogAction, LogLevel } from '../../../entities/assessment-log.entity';

@Injectable()
export class AssessmentLogService {
  constructor(
    @InjectRepository(AssessmentLog)
    private assessmentLogRepository: Repository<AssessmentLog>,
  ) {}

  async createLog(
    assessmentId: string,
    action: LogAction,
    level: LogLevel,
    message: string,
    details?: Record<string, any>,
  ): Promise<AssessmentLog> {
    const log = this.assessmentLogRepository.create({
      assessmentId,
      action,
      level,
      message,
      details,
    });

    return this.assessmentLogRepository.save(log);
  }

  async getAssessmentLogs(assessmentId: string): Promise<AssessmentLog[]> {
    return this.assessmentLogRepository.find({
      where: { assessmentId },
      order: { createdAt: 'ASC' },
    });
  }

  async getLogsByAction(action: LogAction): Promise<AssessmentLog[]> {
    return this.assessmentLogRepository.find({
      where: { action },
      order: { createdAt: 'DESC' },
    });
  }

  async getLogsByLevel(level: LogLevel): Promise<AssessmentLog[]> {
    return this.assessmentLogRepository.find({
      where: { level },
      order: { createdAt: 'DESC' },
    });
  }

  async getErrorLogs(): Promise<AssessmentLog[]> {
    return this.assessmentLogRepository.find({
      where: { level: LogLevel.ERROR },
      order: { createdAt: 'DESC' },
    });
  }
}
