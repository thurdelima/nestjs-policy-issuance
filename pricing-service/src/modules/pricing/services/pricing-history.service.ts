import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingHistory } from '../../../entities/pricing-history.entity';

@Injectable()
export class PricingHistoryService {
  private readonly logger = new Logger(PricingHistoryService.name);

  constructor(
    @InjectRepository(PricingHistory)
    private pricingHistoryRepository: Repository<PricingHistory>,
  ) {}

  async logAction(
    pricingId: string,
    action: string,
    oldValues: Record<string, any> | null,
    newValues: Record<string, any>,
    changeReason: string,
    changedBy?: string,
  ): Promise<PricingHistory> {
    try {
      const history = this.pricingHistoryRepository.create({
        pricingId,
        action,
        oldValues,
        newValues,
        changeReason,
        changedBy,
      });

      const savedHistory = await this.pricingHistoryRepository.save(history);
      
      this.logger.log(`History logged for pricing ${pricingId}: ${action}`);
      return savedHistory;
    } catch (error) {
      this.logger.error('Error logging pricing history:', error);
      throw error;
    }
  }

  async getPricingHistory(
    pricingId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: PricingHistory[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.pricingHistoryRepository.findAndCount({
      where: { pricingId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getHistoryByAction(
    action: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: PricingHistory[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.pricingHistoryRepository.findAndCount({
      where: { action },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getHistoryByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: PricingHistory[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.pricingHistoryRepository.findAndCount({
      where: { changedBy: userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getRecentHistory(
    days: number = 7,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: PricingHistory[]; total: number; page: number; limit: number }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [data, total] = await this.pricingHistoryRepository
      .createQueryBuilder('history')
      .where('history.createdAt >= :since', { since })
      .orderBy('history.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getSignificantChanges(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: PricingHistory[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.pricingHistoryRepository.findAndCount({
      where: {
        action: 'calculated',
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const significantChanges = data.filter(history => history.hasSignificantChange);

    return {
      data: significantChanges,
      total: significantChanges.length,
      page,
      limit,
    };
  }
}
