import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any;
  private channel: any;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672');
      
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      this.logger.log('Connected to RabbitMQ');

      await this.setupUserQueues();
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  private async setupUserQueues() {
    const exchange = 'user.exchange';
    
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    await this.channel.assertQueue('user.created', { durable: true });
    await this.channel.bindQueue('user.created', exchange, 'user.created');

    await this.channel.assertQueue('user.updated', { durable: true });
    await this.channel.bindQueue('user.updated', exchange, 'user.updated');

    await this.channel.assertQueue('user.deleted', { durable: true });
    await this.channel.bindQueue('user.deleted', exchange, 'user.deleted');

    this.logger.log('User queues setup completed');
  }

  async publishMessage(exchange: string, routingKey: string, message: any) {
    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      await this.channel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        timestamp: Date.now(),
      });
      
      this.logger.log(`Message published to ${exchange} with routing key ${routingKey}`);
    } catch (error) {
      this.logger.error('Failed to publish message:', error);
      throw error;
    }
  }

  async publishUserCreated(userData: any) {
    await this.publishMessage('user.exchange', 'user.created', {
      userData,
      timestamp: new Date().toISOString(),
    });
  }

  async publishUserUpdated(userData: any) {
    await this.publishMessage('user.exchange', 'user.updated', {
      userData,
      timestamp: new Date().toISOString(),
    });
  }

  async publishUserDeleted(userId: string) {
    await this.publishMessage('user.exchange', 'user.deleted', {
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}
