import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy, PolicyStatus, PolicyType, PaymentStatus } from '../../entities/policy.entity';
import { PolicyEvent, EventType } from '../../entities/policy-event.entity';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { PolicyEventService } from './services/policy-event.service';
import { ExternalIntegrationService } from './services/external-integration.service';

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(Policy)
    private policyRepository: Repository<Policy>,
    private policyEventService: PolicyEventService,
    private externalIntegrationService: ExternalIntegrationService,
  ) {}

  async create(createPolicyDto: CreatePolicyDto, agentId: string): Promise<Policy> {
    const policyNumber = await this.generatePolicyNumber(createPolicyDto.type);

    const policy = this.policyRepository.create({
      ...createPolicyDto,
      policyNumber,
      agentId,
      status: PolicyStatus.DRAFT,
    });

    const savedPolicy = await this.policyRepository.save(policy);

    await this.policyEventService.createEvent(
      savedPolicy.id,
      EventType.POLICY_CREATED,
      'Policy created successfully',
      { policyData: createPolicyDto },
    );

    return savedPolicy;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: PolicyStatus;
      type?: PolicyType;
      customerId?: string;
      agentId?: string;
    },
  ): Promise<{ policies: Policy[]; total: number }> {
    const queryBuilder = this.policyRepository.createQueryBuilder('policy');

    if (filters?.status) {
      queryBuilder.andWhere('policy.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      queryBuilder.andWhere('policy.type = :type', { type: filters.type });
    }

    if (filters?.customerId) {
      queryBuilder.andWhere('policy.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters?.agentId) {
      queryBuilder.andWhere('policy.agentId = :agentId', { agentId: filters.agentId });
    }

    const [policies, total] = await queryBuilder
      .orderBy('policy.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { policies, total };
  }

  async findOne(id: string): Promise<Policy> {
    const policy = await this.policyRepository.findOne({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    return policy;
  }

  async findByPolicyNumber(policyNumber: string): Promise<Policy> {
    const policy = await this.policyRepository.findOne({
      where: { policyNumber },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    return policy;
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto): Promise<Policy> {
    const policy = await this.findOne(id);

    if (policy.status === PolicyStatus.ACTIVE && updatePolicyDto.status !== PolicyStatus.CANCELLED) {
      throw new BadRequestException('Active policies can only be cancelled');
    }

    Object.assign(policy, updatePolicyDto);
    const updatedPolicy = await this.policyRepository.save(policy);

    await this.policyEventService.createEvent(
      id,
      EventType.POLICY_UPDATED,
      'Policy updated',
      { updateData: updatePolicyDto },
    );

    return updatedPolicy;
  }

  async remove(id: string): Promise<void> {
    const policy = await this.findOne(id);

    if (policy.status === PolicyStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete active policy');
    }

    await this.policyRepository.remove(policy);
  }

  async initiateCreditAssessment(policyId: string): Promise<Policy> {
    const policy = await this.findOne(policyId);

    if (policy.status !== PolicyStatus.DRAFT) {
      throw new BadRequestException('Only draft policies can initiate credit assessment');
    }

    policy.status = PolicyStatus.PENDING_CREDIT_ASSESSMENT;
    await this.policyRepository.save(policy);

    await this.policyEventService.createEvent(
      policyId,
      EventType.CREDIT_ASSESSMENT_REQUESTED,
      'Credit assessment requested',
      { policyId },
    );

    await this.externalIntegrationService.requestCreditAssessment(policy);

    return policy;
  }

  async completeCreditAssessment(policyId: string, assessmentResult: any): Promise<Policy> {
    const policy = await this.findOne(policyId);

    if (policy.status !== PolicyStatus.PENDING_CREDIT_ASSESSMENT) {
      throw new BadRequestException('Policy is not in credit assessment status');
    }

    policy.creditAssessment = assessmentResult;
    policy.status = PolicyStatus.PENDING_PRICING;
    await this.policyRepository.save(policy);

    await this.policyEventService.createEvent(
      policyId,
      EventType.CREDIT_ASSESSMENT_COMPLETED,
      'Credit assessment completed',
      { assessmentResult },
    );

    await this.externalIntegrationService.requestPricing(policy);

    return policy;
  }

  async completePricing(policyId: string, pricingResult: any): Promise<Policy> {
    const policy = await this.findOne(policyId);

    if (policy.status !== PolicyStatus.PENDING_PRICING) {
      throw new BadRequestException('Policy is not in pricing status');
    }

    policy.pricingDetails = pricingResult;
    policy.premiumAmount = pricingResult.totalPremium;
    policy.status = PolicyStatus.PENDING_PAYMENT;
    policy.paymentDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.policyRepository.save(policy);

    await this.policyEventService.createEvent(
      policyId,
      EventType.PRICING_COMPLETED,
      'Pricing completed',
      { pricingResult },
    );

    return policy;
  }

  async processPayment(policyId: string, paymentData: any): Promise<Policy> {
    const policy = await this.findOne(policyId);

    if (policy.status !== PolicyStatus.PENDING_PAYMENT && policy.status !== PolicyStatus.DRAFT) {
      throw new BadRequestException('Policy is not in payment pending status or draft status');
    }

    policy.paymentStatus = PaymentStatus.PAID;
    policy.paymentDate = new Date();
    policy.status = PolicyStatus.ACTIVE;
    policy.effectiveDate = new Date();
    
    const savedPolicy = await this.policyRepository.save(policy);

    await this.policyEventService.createEvent(
      policyId,
      EventType.PAYMENT_PROCESSED,
      'Payment processed successfully',
      { paymentData },
    );

    await this.externalIntegrationService.notifyBillingService(policy);
    await this.externalIntegrationService.notifyAccountingService(policy);
    await this.externalIntegrationService.notifyPaymentService(policy, paymentData);
    
    return savedPolicy;
  }

  async cancelPolicy(policyId: string, reason: string): Promise<Policy> {
    const policy = await this.findOne(policyId);

    if (policy.status === PolicyStatus.CANCELLED) {
      throw new BadRequestException('Policy is already cancelled');
    }

    policy.status = PolicyStatus.CANCELLED;
    policy.cancellationDate = new Date();
    policy.cancellationReason = reason;
    await this.policyRepository.save(policy);

    await this.policyEventService.createEvent(
      policyId,
      EventType.POLICY_CANCELLED,
      'Policy cancelled',
      { reason },
    );

    return policy;
  }

  private async generatePolicyNumber(type: PolicyType): Promise<string> {
    const prefix = type === PolicyType.FIANCA ? 'FIA' : 'CAP';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const lastPolicy = await this.policyRepository
      .createQueryBuilder('policy')
      .where('policy.policyNumber LIKE :pattern', { pattern: `${prefix}${year}${month}%` })
      .orderBy('policy.policyNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastPolicy) {
      const lastSequence = parseInt(lastPolicy.policyNumber.slice(-6));
      sequence = lastSequence + 1;
    }

    return `${prefix}${year}${month}${String(sequence).padStart(6, '0')}`;
  }

  async getPolicyEvents(policyId: string): Promise<PolicyEvent[]> {
    return this.policyEventService.getPolicyEvents(policyId);
  }
}
