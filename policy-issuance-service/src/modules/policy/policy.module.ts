import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policy } from '../../entities/policy.entity';
import { PolicyEvent } from '../../entities/policy-event.entity';
import { PolicyService } from './policy.service';
import { PolicyController } from './policy.controller';
import { PolicyEventService } from './services/policy-event.service';
import { ExternalIntegrationService } from './services/external-integration.service';

@Module({
  imports: [TypeOrmModule.forFeature([Policy, PolicyEvent])],
  providers: [PolicyService, PolicyEventService, ExternalIntegrationService],
  controllers: [PolicyController],
  exports: [PolicyService, PolicyEventService, ExternalIntegrationService],
})
export class PolicyModule {}
