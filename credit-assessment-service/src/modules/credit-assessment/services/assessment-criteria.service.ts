import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentCriteria, CriteriaType } from '../../../entities/assessment-criteria.entity';

@Injectable()
export class AssessmentCriteriaService {
  constructor(
    @InjectRepository(AssessmentCriteria)
    private criteriaRepository: Repository<AssessmentCriteria>,
  ) {}

  async create(criteriaData: Partial<AssessmentCriteria>): Promise<AssessmentCriteria> {
    const criteria = this.criteriaRepository.create(criteriaData);
    return this.criteriaRepository.save(criteria);
  }

  async findAll(): Promise<AssessmentCriteria[]> {
    return this.criteriaRepository.find({
      where: { isActive: true },
      order: { weight: 'DESC' },
    });
  }

  async findByType(type: CriteriaType): Promise<AssessmentCriteria[]> {
    return this.criteriaRepository.find({
      where: { type, isActive: true },
      order: { weight: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AssessmentCriteria> {
    return this.criteriaRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateData: Partial<AssessmentCriteria>): Promise<AssessmentCriteria> {
    const criteria = await this.findOne(id);
    Object.assign(criteria, updateData);
    return this.criteriaRepository.save(criteria);
  }

  async remove(id: string): Promise<void> {
    await this.criteriaRepository.delete(id);
  }

  async deactivate(id: string): Promise<AssessmentCriteria> {
    const criteria = await this.findOne(id);
    criteria.isActive = false;
    return this.criteriaRepository.save(criteria);
  }

  async getDefaultCriteria(): Promise<AssessmentCriteria[]> {
    const existingCriteria = await this.findAll();
    
    if (existingCriteria.length === 0) {
      const defaultCriteria = [
        {
          name: 'Income Ratio',
          description: 'Monthly income to requested amount ratio',
          type: CriteriaType.INCOME_RATIO,
          operator: 'gte' as any,
          value: {
            minValue: 1.0,
            maxValue: 5.0,
          },
          weight: 25,
        },
        {
          name: 'Debt to Income Ratio',
          description: 'Monthly expenses to income ratio',
          type: CriteriaType.DEBT_TO_INCOME,
          operator: 'lte' as any,
          value: {
            minValue: 0.0,
            maxValue: 1.0,
          },
          weight: 20,
        },
        {
          name: 'Credit History Score',
          description: 'Credit bureau score',
          type: CriteriaType.CREDIT_HISTORY,
          operator: 'gte' as any,
          value: {
            minValue: 300,
            maxValue: 800,
          },
          weight: 30,
        },
        {
          name: 'Employment Stability',
          description: 'Employment status and stability',
          type: CriteriaType.EMPLOYMENT_STABILITY,
          operator: 'gte' as any,
          value: {
            minValue: 0,
            maxValue: 100,
          },
          weight: 15,
        },
        {
          name: 'Collateral Value',
          description: 'Collateral to loan amount ratio',
          type: CriteriaType.COLLATERAL,
          operator: 'gte' as any,
          value: {
            minValue: 0.0,
            maxValue: 2.0,
          },
          weight: 10,
        },
      ];

      for (const criteria of defaultCriteria) {
        await this.create(criteria);
      }

      return this.findAll();
    }

    return existingCriteria;
  }
}
