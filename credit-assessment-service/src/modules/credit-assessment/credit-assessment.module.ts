import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditAssessment } from '../../entities/credit-assessment.entity';
import { AssessmentCriteria } from '../../entities/assessment-criteria.entity';
import { AssessmentLog } from '../../entities/assessment-log.entity';
import { CreditAssessmentService } from './credit-assessment.service';
import { CreditAssessmentController } from './credit-assessment.controller';
import { AssessmentCriteriaService } from './services/assessment-criteria.service';
import { AssessmentLogService } from './services/assessment-log.service';
import { CreditScoringService } from './services/credit-scoring.service';
import { ExternalDataService } from './services/external-data.service';

@Module({
  imports: [TypeOrmModule.forFeature([CreditAssessment, AssessmentCriteria, AssessmentLog])],
  providers: [
    CreditAssessmentService,
    AssessmentCriteriaService,
    AssessmentLogService,
    CreditScoringService,
    ExternalDataService,
  ],
  controllers: [CreditAssessmentController],
  exports: [
    CreditAssessmentService,
    AssessmentCriteriaService,
    AssessmentLogService,
    CreditScoringService,
    ExternalDataService,
  ],
})
export class CreditAssessmentModule {}
