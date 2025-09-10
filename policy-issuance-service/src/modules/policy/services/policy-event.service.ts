import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyEvent, EventType, EventStatus } from '../../../entities/policy-event.entity';

@Injectable()
export class PolicyEventService {
  constructor(
    @InjectRepository(PolicyEvent)
    private policyEventRepository: Repository<PolicyEvent>,
  ) {}

  async createEvent(
    policyId: string,
    eventType: EventType,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<PolicyEvent> {
    const event = this.policyEventRepository.create({
      policyId,
      eventType,
      description,
      metadata,
      status: EventStatus.COMPLETED,
    });

    return this.policyEventRepository.save(event);
  }

  async createPendingEvent(
    policyId: string,
    eventType: EventType,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<PolicyEvent> {
    const event = this.policyEventRepository.create({
      policyId,
      eventType,
      description,
      metadata,
      status: EventStatus.PENDING,
    });

    return this.policyEventRepository.save(event);
  }

  async updateEventStatus(
    eventId: string,
    status: EventStatus,
    errorMessage?: string,
  ): Promise<PolicyEvent> {
    const event = await this.policyEventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    event.status = status;
    
    if (errorMessage) {
      event.metadata = {
        ...event.metadata,
        errorMessage,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.policyEventRepository.save(event);
  }

  async getPolicyEvents(policyId: string): Promise<PolicyEvent[]> {
    return this.policyEventRepository.find({
      where: { policyId },
      order: { createdAt: 'DESC' },
    });
  }

  async getEventsByType(eventType: EventType): Promise<PolicyEvent[]> {
    return this.policyEventRepository.find({
      where: { eventType },
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingEvents(): Promise<PolicyEvent[]> {
    return this.policyEventRepository.find({
      where: { status: EventStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  async getFailedEvents(): Promise<PolicyEvent[]> {
    return this.policyEventRepository.find({
      where: { status: EventStatus.FAILED },
      order: { createdAt: 'DESC' },
    });
  }
}
