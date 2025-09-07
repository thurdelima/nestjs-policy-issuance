import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditAssessment, AssessmentStatus, AssessmentResult, RiskLevel } from '../../entities/credit-assessment.entity';
import { AssessmentLog, LogAction, LogLevel } from '../../entities/assessment-log.entity';
import { CreateCreditAssessmentDto } from './dto/create-credit-assessment.dto';
import { UpdateCreditAssessmentDto } from './dto/update-credit-assessment.dto';
import { AssessmentLogService } from './services/assessment-log.service';
import { CreditScoringService } from './services/credit-scoring.service';
import { ExternalDataService } from './services/external-data.service';
import { RabbitMQService } from '../../shared/rabbitmq/rabbitmq.service';

@Injectable()
export class CreditAssessmentService {
  constructor(
    @InjectRepository(CreditAssessment)
    private creditAssessmentRepository: Repository<CreditAssessment>,
    private assessmentLogService: AssessmentLogService,
    private creditScoringService: CreditScoringService,
    private externalDataService: ExternalDataService,
    private rabbitMQService: RabbitMQService,
  ) {}

  async create(createDto: CreateCreditAssessmentDto): Promise<CreditAssessment> {
    // Check if assessment already exists for this policy
    const existingAssessment = await this.creditAssessmentRepository.findOne({
      where: { policyId: createDto.policyId },
    });

    if (existingAssessment) {
      throw new BadRequestException('Credit assessment already exists for this policy');
    }

    // Create assessment
    const assessment = this.creditAssessmentRepository.create({
      ...createDto,
      status: AssessmentStatus.PENDING,
    });

    const savedAssessment = await this.creditAssessmentRepository.save(assessment);

    // Log assessment creation
    await this.assessmentLogService.createLog(
      savedAssessment.id,
      LogAction.ASSESSMENT_STARTED,
      LogLevel.INFO,
      'Credit assessment created',
      { assessmentData: createDto },
    );

    return savedAssessment;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: AssessmentStatus;
      result?: AssessmentResult;
      customerId?: string;
    },
  ): Promise<{ assessments: CreditAssessment[]; total: number }> {
    const queryBuilder = this.creditAssessmentRepository.createQueryBuilder('assessment');

    if (filters?.status) {
      queryBuilder.andWhere('assessment.status = :status', { status: filters.status });
    }

    if (filters?.result) {
      queryBuilder.andWhere('assessment.result = :result', { result: filters.result });
    }

    if (filters?.customerId) {
      queryBuilder.andWhere('assessment.customerId = :customerId', { customerId: filters.customerId });
    }

    const [assessments, total] = await queryBuilder
      .orderBy('assessment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { assessments, total };
  }

  async findOne(id: string): Promise<CreditAssessment> {
    const assessment = await this.creditAssessmentRepository.findOne({
      where: { id },
    });

    if (!assessment) {
      throw new NotFoundException('Credit assessment not found');
    }

    return assessment;
  }

  async findByPolicyId(policyId: string): Promise<CreditAssessment> {
    const assessment = await this.creditAssessmentRepository.findOne({
      where: { policyId },
    });

    if (!assessment) {
      throw new NotFoundException('Credit assessment not found for this policy');
    }

    return assessment;
  }

  async update(id: string, updateDto: UpdateCreditAssessmentDto): Promise<CreditAssessment> {
    const assessment = await this.findOne(id);

    Object.assign(assessment, updateDto);
    const updatedAssessment = await this.creditAssessmentRepository.save(assessment);

    // Log update
    await this.assessmentLogService.createLog(
      id,
      LogAction.ASSESSMENT_STARTED,
      LogLevel.INFO,
      'Assessment updated',
      { updateData: updateDto },
    );

    return updatedAssessment;
  }

  async processAssessment(assessmentId: string): Promise<CreditAssessment> {
    const assessment = await this.findOne(assessmentId);

    if (assessment.status !== AssessmentStatus.PENDING) {
      throw new BadRequestException('Assessment is not in pending status');
    }

    // Update status to in progress
    assessment.status = AssessmentStatus.IN_PROGRESS;
    await this.creditAssessmentRepository.save(assessment);

    // Log start of processing
    await this.assessmentLogService.createLog(
      assessmentId,
      LogAction.ASSESSMENT_STARTED,
      LogLevel.INFO,
      'Assessment processing started',
    );

    try {
      // 1. Gather external data
      await this.assessmentLogService.createLog(
        assessmentId,
        LogAction.EXTERNAL_API_CALLED,
        LogLevel.INFO,
        'Gathering external data',
      );

      const externalData = await this.externalDataService.gatherExternalData(assessment);
      assessment.externalData = externalData;

      // 2. Calculate credit score
      await this.assessmentLogService.createLog(
        assessmentId,
        LogAction.SCORE_CALCULATED,
        LogLevel.INFO,
        'Calculating credit score',
      );

      const scoringResult = await this.creditScoringService.calculateScore(assessment);
      assessment.creditScore = scoringResult.score;
      assessment.riskLevel = scoringResult.riskLevel;
      assessment.assessmentCriteria = scoringResult.criteria;

      // 3. Make decision
      await this.assessmentLogService.createLog(
        assessmentId,
        LogAction.DECISION_MADE,
        LogLevel.INFO,
        'Making credit decision',
      );

      const decision = await this.makeCreditDecision(assessment);
      assessment.result = decision.result;
      assessment.approvedAmount = decision.approvedAmount;
      assessment.interestRate = decision.interestRate;
      assessment.termMonths = decision.termMonths;
      assessment.rejectionReason = decision.rejectionReason;

      // 4. Complete assessment
      assessment.status = AssessmentStatus.COMPLETED;
      await this.creditAssessmentRepository.save(assessment);

      // Log completion
      await this.assessmentLogService.createLog(
        assessmentId,
        LogAction.ASSESSMENT_COMPLETED,
        LogLevel.INFO,
        'Assessment completed successfully',
        { result: decision },
      );

      // 5. Notify policy service
      await this.notifyPolicyService(assessment);

      return assessment;

    } catch (error) {
      // Handle error
      assessment.status = AssessmentStatus.FAILED;
      await this.creditAssessmentRepository.save(assessment);

      await this.assessmentLogService.createLog(
        assessmentId,
        LogAction.ERROR_OCCURRED,
        LogLevel.ERROR,
        'Assessment failed',
        { error: error.message },
      );

      throw error;
    }
  }

  private async makeCreditDecision(assessment: CreditAssessment): Promise<{
    result: AssessmentResult;
    approvedAmount?: number;
    interestRate?: number;
    termMonths?: number;
    rejectionReason?: string;
  }> {
    const { creditScore, riskLevel, requestedAmount } = assessment;

    // Decision logic based on score and risk level
    if (creditScore >= 700 && riskLevel === RiskLevel.LOW) {
      return {
        result: AssessmentResult.APPROVED,
        approvedAmount: requestedAmount,
        interestRate: 12.5,
        termMonths: 12,
      };
    } else if (creditScore >= 600 && riskLevel === RiskLevel.MEDIUM) {
      return {
        result: AssessmentResult.APPROVED,
        approvedAmount: requestedAmount * 0.8, // 80% of requested amount
        interestRate: 15.0,
        termMonths: 12,
      };
    } else if (creditScore >= 500 && riskLevel === RiskLevel.MEDIUM) {
      return {
        result: AssessmentResult.APPROVED,
        approvedAmount: requestedAmount * 0.6, // 60% of requested amount
        interestRate: 18.0,
        termMonths: 6,
      };
    } else {
      return {
        result: AssessmentResult.REJECTED,
        rejectionReason: `Credit score too low (${creditScore}) and risk level too high (${riskLevel})`,
      };
    }
  }

  private async notifyPolicyService(assessment: CreditAssessment): Promise<void> {
    try {
      const message = {
        policyId: assessment.policyId,
        assessmentId: assessment.id,
        result: assessment.result,
        creditScore: assessment.creditScore,
        riskLevel: assessment.riskLevel,
        approvedAmount: assessment.approvedAmount,
        rejectionReason: assessment.rejectionReason,
        completedAt: new Date(),
        timestamp: new Date().toISOString(),
      };

      const queueName = 'policy.issuance.queue';
      await this.rabbitMQService.publishMessage(queueName, message);
    } catch (error) {
      console.error('Failed to notify policy service:', error);
    }
  }

  async getAssessmentLogs(assessmentId: string): Promise<AssessmentLog[]> {
    return this.assessmentLogService.getAssessmentLogs(assessmentId);
  }

  async cancelAssessment(assessmentId: string, reason: string): Promise<CreditAssessment> {
    const assessment = await this.findOne(assessmentId);

    if (assessment.status === AssessmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed assessment');
    }

    assessment.status = AssessmentStatus.CANCELLED;
    assessment.rejectionReason = reason;
    await this.creditAssessmentRepository.save(assessment);

    await this.assessmentLogService.createLog(
      assessmentId,
      LogAction.ASSESSMENT_STARTED,
      LogLevel.INFO,
      'Assessment cancelled',
      { reason },
    );

    return assessment;
  }
}
