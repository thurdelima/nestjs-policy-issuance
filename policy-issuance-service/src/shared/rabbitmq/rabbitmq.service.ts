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
      const url = this.configService.get('RABBITMQ_URL', 'amqp://admin:admin123@localhost:5672');
      
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      this.logger.log('Connected to RabbitMQ');

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
      });

      this.channel.on('error', (err) => {
        this.logger.error('RabbitMQ channel error:', err);
      });

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

  async publishMessage(queueName: string, message: any, options?: amqp.Options.Publish) {
    try {
      await this.channel.assertQueue(queueName, { durable: true });
      
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      const result = this.channel.sendToQueue(queueName, messageBuffer, {
        persistent: true,
        ...options,
      });

      this.logger.log(`Message published to queue: ${queueName}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to publish message to queue ${queueName}:`, error);
      throw error;
    }
  }

  async consumeMessage(queueName: string, callback: (message: any) => Promise<void>) {
    try {
      await this.channel.assertQueue(queueName, { durable: true });
      
      this.channel.consume(queueName, async (msg) => {
        if (msg) {
          try {
            const message = JSON.parse(msg.content.toString());
            await callback(message);
            this.channel.ack(msg);
            this.logger.log(`Message consumed from queue: ${queueName}`);
          } catch (error) {
            this.logger.error(`Error processing message from queue ${queueName}:`, error);
            this.channel.nack(msg, false, false);
          }
        }
      });

      this.logger.log(`Started consuming from queue: ${queueName}`);
    } catch (error) {
      this.logger.error(`Failed to consume from queue ${queueName}:`, error);
      throw error;
    }
  }

  async createExchange(exchangeName: string, type: string = 'topic') {
    try {
      await this.channel.assertExchange(exchangeName, type, { durable: true });
      this.logger.log(`Exchange created: ${exchangeName}`);
    } catch (error) {
      this.logger.error(`Failed to create exchange ${exchangeName}:`, error);
      throw error;
    }
  }

  async bindQueue(queueName: string, exchangeName: string, routingKey: string) {
    try {
      await this.channel.assertQueue(queueName, { durable: true });
      await this.channel.bindQueue(queueName, exchangeName, routingKey);
      this.logger.log(`Queue ${queueName} bound to exchange ${exchangeName} with routing key ${routingKey}`);
    } catch (error) {
      this.logger.error(`Failed to bind queue ${queueName}:`, error);
      throw error;
    }
  }

  getChannel(): any {
    return this.channel;
  }

  getConnection(): any {
    return this.connection;
  }
}
