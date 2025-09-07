import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CreditAssessment } from './credit-assessment.entity';

export enum LogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  DEBUG = 'debug',
}

export enum LogAction {
  ASSESSMENT_STARTED = 'assessment_started',
  CRITERIA_EVALUATED = 'criteria_evaluated',
  EXTERNAL_API_CALLED = 'external_api_called',
  SCORE_CALCULATED = 'score_calculated',
  DECISION_MADE = 'decision_made',
  ASSESSMENT_COMPLETED = 'assessment_completed',
  ERROR_OCCURRED = 'error_occurred',
}

@Entity('assessment_logs')
@Index(['assessmentId'])
@Index(['action'])
@Index(['level'])
@Index(['createdAt'])
export class AssessmentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'assessment_id' })
  assessmentId: string;

  @Column({
    type: 'enum',
    enum: LogAction,
  })
  action: LogAction;

  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO,
  })
  level: LogLevel;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true, name: 'details' })
  details: Record<string, any>;

  // Relations
  @ManyToOne(() => CreditAssessment, (assessment) => assessment.id)
  @JoinColumn({ name: 'assessment_id' })
  assessment: CreditAssessment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
