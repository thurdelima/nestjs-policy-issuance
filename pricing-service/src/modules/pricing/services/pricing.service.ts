import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Pricing, PricingStatus } from '../../../entities/pricing.entity';
import { PricingRule } from '../../../entities/pricing-rule.entity';
import { PricingHistory } from '../../../entities/pricing-history.entity';
import { CreatePricingDto } from '../dto/create-pricing.dto';
import { UpdatePricingDto } from '../dto/update-pricing.dto';
import { PricingCalculationService } from './pricing-calculation.service';
import { PricingHistoryService } from './pricing-history.service';
import { RabbitMQService } from '../../../shared/rabbitmq/rabbitmq.service';
import { RedisService } from '../../../shared/redis/redis.service';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @InjectRepository(Pricing)
    private pricingRepository: Repository<Pricing>,
    @InjectRepository(PricingRule)
    private pricingRuleRepository: Repository<PricingRule>,
    private pricingCalculationService: PricingCalculationService,
    private pricingHistoryService: PricingHistoryService,
    private rabbitMQService: RabbitMQService,
    private redisService: RedisService,
  ) {}

  async create(createPricingDto: CreatePricingDto, userId: string): Promise<Pricing> {
    try {
      // Check if pricing already exists for this policy
      const existingPricing = await this.pricingRepository.findOne({
        where: { policyId: createPricingDto.policyId, status: PricingStatus.ACTIVE },
      });

      if (existingPricing) {
        throw new BadRequestException('Active pricing already exists for this policy');
      }

      // Create new pricing
      const pricing = this.pricingRepository.create({
        ...createPricingDto,
        status: PricingStatus.DRAFT,
        totalPremium: createPricingDto.basePremium, // Will be recalculated
      });

      // Calculate final premium
      const calculatedPricing = await this.pricingCalculationService.calculateFinalPremium(
        pricing,
        createPricingDto.pricingDetails || {},
      );

      const savedPricing = await this.pricingRepository.save(calculatedPricing);

      // Log creation
      await this.pricingHistoryService.logAction(
        savedPricing.id,
        'created',
        null,
        savedPricing,
        'Pricing created',
        userId,
      );

      // Publish pricing calculation event
      await this.rabbitMQService.publishPricingCalculationRequest(
        savedPricing.policyId,
        savedPricing,
      );

      this.logger.log(`Pricing created for policy ${savedPricing.policyId}`);
      return savedPricing;
    } catch (error) {
      this.logger.error('Error creating pricing:', error);
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: PricingStatus,
    policyId?: string,
  ): Promise<{ data: Pricing[]; total: number; page: number; limit: number }> {
    const where: FindOptionsWhere<Pricing> = {};

    if (status) {
      where.status = status;
    }

    if (policyId) {
      where.policyId = policyId;
    }

    const [data, total] = await this.pricingRepository.findAndCount({
      where,
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

  async findOne(id: string): Promise<Pricing> {
    const pricing = await this.pricingRepository.findOne({
      where: { id },
    });

    if (!pricing) {
      throw new NotFoundException(`Pricing with ID ${id} not found`);
    }

    return pricing;
  }

  async findByPolicyId(policyId: string): Promise<Pricing[]> {
    return this.pricingRepository.find({
      where: { policyId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updatePricingDto: UpdatePricingDto, userId: string): Promise<Pricing> {
    const pricing = await this.findOne(id);

    if (pricing.status === PricingStatus.ACTIVE && updatePricingDto.status !== PricingStatus.INACTIVE) {
      throw new BadRequestException('Cannot modify active pricing');
    }

    const oldValues = { ...pricing };

    // Update pricing
    Object.assign(pricing, updatePricingDto);

    // Recalculate if premium values changed
    if (this.hasPremiumChanges(updatePricingDto)) {
      const calculatedPricing = await this.pricingCalculationService.calculateFinalPremium(
        pricing,
        pricing.pricingDetails || {},
      );
      Object.assign(pricing, calculatedPricing);
    }

    const updatedPricing = await this.pricingRepository.save(pricing);

    // Log update
    await this.pricingHistoryService.logAction(
      id,
      'updated',
      oldValues,
      updatedPricing,
      'Pricing updated',
      userId,
    );

    this.logger.log(`Pricing ${id} updated`);
    return updatedPricing;
  }

  async approve(id: string, userId: string): Promise<Pricing> {
    const pricing = await this.findOne(id);

    if (pricing.status !== PricingStatus.DRAFT) {
      throw new BadRequestException('Only draft pricing can be approved');
    }

    const oldValues = { ...pricing };

    pricing.status = PricingStatus.ACTIVE;
    pricing.approvedBy = userId;
    pricing.approvedAt = new Date();

    const approvedPricing = await this.pricingRepository.save(pricing);

    // Log approval
    await this.pricingHistoryService.logAction(
      id,
      'approved',
      oldValues,
      approvedPricing,
      'Pricing approved',
      userId,
    );

    // Publish approval event
    await this.rabbitMQService.publishPricingResult(
      approvedPricing.policyId,
      approvedPricing,
    );

    this.logger.log(`Pricing ${id} approved`);
    return approvedPricing;
  }

  async reject(id: string, reason: string, userId: string): Promise<Pricing> {
    const pricing = await this.findOne(id);

    if (pricing.status !== PricingStatus.DRAFT) {
      throw new BadRequestException('Only draft pricing can be rejected');
    }

    const oldValues = { ...pricing };

    pricing.status = PricingStatus.INACTIVE;
    pricing.rejectionReason = reason;

    const rejectedPricing = await this.pricingRepository.save(pricing);

    // Log rejection
    await this.pricingHistoryService.logAction(
      id,
      'rejected',
      oldValues,
      rejectedPricing,
      `Pricing rejected: ${reason}`,
      userId,
    );

    this.logger.log(`Pricing ${id} rejected: ${reason}`);
    return rejectedPricing;
  }

  async recalculate(id: string, userId: string): Promise<Pricing> {
    const pricing = await this.findOne(id);

    const oldValues = { ...pricing };

    // Recalculate final premium
    const calculatedPricing = await this.pricingCalculationService.calculateFinalPremium(
      pricing,
      pricing.pricingDetails || {},
    );

    Object.assign(pricing, calculatedPricing);
    const recalculatedPricing = await this.pricingRepository.save(pricing);

    // Log recalculation
    await this.pricingHistoryService.logAction(
      id,
      'calculated',
      oldValues,
      recalculatedPricing,
      'Premium recalculated',
      userId,
    );

    this.logger.log(`Pricing ${id} recalculated`);
    return recalculatedPricing;
  }

  async deactivate(id: string, userId: string): Promise<Pricing> {
    const pricing = await this.findOne(id);

    if (pricing.status !== PricingStatus.ACTIVE) {
      throw new BadRequestException('Only active pricing can be deactivated');
    }

    const oldValues = { ...pricing };

    pricing.status = PricingStatus.INACTIVE;
    const deactivatedPricing = await this.pricingRepository.save(pricing);

    // Log deactivation
    await this.pricingHistoryService.logAction(
      id,
      'deactivated',
      oldValues,
      deactivatedPricing,
      'Pricing deactivated',
      userId,
    );

    this.logger.log(`Pricing ${id} deactivated`);
    return deactivatedPricing;
  }

  private hasPremiumChanges(updateDto: UpdatePricingDto): boolean {
    const premiumFields = [
      'basePremium',
      'taxes',
      'fees',
      'discounts',
      'adjustments',
      'totalPremium',
    ];

    return premiumFields.some(field => updateDto[field] !== undefined);
  }
}
