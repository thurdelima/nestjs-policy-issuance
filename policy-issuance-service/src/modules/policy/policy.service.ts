import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy, PolicyStatus, PolicyType, PaymentStatus } from '../../entities/policy.entity';
import { PolicyEvent, EventType } from '../../entities/policy-event.entity';
// User entity removed - using external User Manager Service
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
    // Generate policy number
    const policyNumber = await this.generatePolicyNumber(createPolicyDto.type);

    // Create policy
    const policy = this.policyRepository.create({
      ...createPolicyDto,
      policyNumber,
      agentId,
      status: PolicyStatus.DRAFT,
    });

    const savedPolicy = await this.policyRepository.save(policy);

    // Create event
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

    // Check if policy can be updated
    if (policy.status === PolicyStatus.ACTIVE && updatePolicyDto.status !== PolicyStatus.CANCELLED) {
      throw new BadRequestException('Active policies can only be cancelled');
    }

    Object.assign(policy, updatePolicyDto);
    const updatedPolicy = await this.policyRepository.save(policy);

    // Create event
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

    // Update policy status
    policy.status = PolicyStatus.PENDING_CREDIT_ASSESSMENT;
    await this.policyRepository.save(policy);

    // Create event
    await this.policyEventService.createEvent(
      policyId,
      EventType.CREDIT_ASSESSMENT_REQUESTED,
      'Credit assessment requested',
      { policyId },
    );

    // Send message to credit assessment service
    await this.externalIntegrationService.requestCreditAssessment(policy);

    return policy;
  }

  async completeCreditAssessment(policyId: string, assessmentResult: any): Promise<Policy> {
    const policy = await this.findOne(policyId);

    if (policy.status !== PolicyStatus.PENDING_CREDIT_ASSESSMENT) {
      throw new BadRequestException('Policy is not in credit assessment status');
    }

    // Update policy with credit assessment result
    policy.creditAssessment = assessmentResult;
    policy.status = PolicyStatus.PENDING_PRICING;
    await this.policyRepository.save(policy);

    // Create event
    await this.policyEventService.createEvent(
      policyId,
      EventType.CREDIT_ASSESSMENT_COMPLETED,
      'Credit assessment completed',
      { assessmentResult },
    );

    // Send message to pricing service
    await this.externalIntegrationService.requestPricing(policy);

    return policy;
  }

  async completePricing(policyId: string, pricingResult: any): Promise<Policy> {
    const policy = await this.findOne(policyId);

    if (policy.status !== PolicyStatus.PENDING_PRICING) {
      throw new BadRequestException('Policy is not in pricing status');
    }

    // Update policy with pricing result
    policy.pricingDetails = pricingResult;
    policy.premiumAmount = pricingResult.totalPremium;
    policy.status = PolicyStatus.PENDING_PAYMENT;
    policy.paymentDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    await this.policyRepository.save(policy);

    // Create event
    await this.policyEventService.createEvent(
      policyId,
      EventType.PRICING_COMPLETED,
      'Pricing completed',
      { pricingResult },
    );

    return policy;
  }

  async processPayment(policyId: string, paymentData: any): Promise<Policy> {
    console.log('🔍 [DEBUG] Starting processPayment for policyId:', policyId);
    
    const policy = await this.findOne(policyId);
    console.log('🔍 [DEBUG] Policy found:', {
      id: policy.id,
      status: policy.status,
      paymentStatus: policy.paymentStatus,
      policyNumber: policy.policyNumber
    });

    if (policy.status !== PolicyStatus.PENDING_PAYMENT && policy.status !== PolicyStatus.DRAFT) {
      console.log('❌ [DEBUG] Policy status validation failed:', {
        currentStatus: policy.status,
        expectedStatuses: [PolicyStatus.PENDING_PAYMENT, PolicyStatus.DRAFT]
      });
      throw new BadRequestException('Policy is not in payment pending status or draft status');
    }
    
    console.log('✅ [DEBUG] Policy status validation passed, proceeding with payment...');

    // Update payment status
    console.log('🔄 [DEBUG] Updating policy status and payment info...');
    policy.paymentStatus = PaymentStatus.PAID;
    policy.paymentDate = new Date();
    policy.status = PolicyStatus.ACTIVE;
    policy.effectiveDate = new Date();
    
    console.log('💾 [DEBUG] Saving policy to database...');
    const savedPolicy = await this.policyRepository.save(policy);
    console.log('✅ [DEBUG] Policy saved successfully:', {
      id: savedPolicy.id,
      status: savedPolicy.status,
      paymentStatus: savedPolicy.paymentStatus,
      paymentDate: savedPolicy.paymentDate
    });

    // Create event
    await this.policyEventService.createEvent(
      policyId,
      EventType.PAYMENT_PROCESSED,
      'Payment processed successfully',
      { paymentData },
    );

    // Send messages to billing, accounting and payment services
    console.log('📤 [DEBUG] Sending notifications to external services...');
    await this.externalIntegrationService.notifyBillingService(policy);
    await this.externalIntegrationService.notifyAccountingService(policy);
    await this.externalIntegrationService.notifyPaymentService(policy, paymentData);
    
    console.log('🎉 [DEBUG] Payment processing completed successfully!');
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

    // Create event
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
    
    // Get the last policy number for this type and month
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
