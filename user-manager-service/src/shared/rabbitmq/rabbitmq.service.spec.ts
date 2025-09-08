import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';

jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

import * as amqp from 'amqplib';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let configService: jest.Mocked<ConfigService>;

  // Mocks de conexão e canal
  let connectionMock: any;
  let channelMock: any;

  beforeEach(() => {
    channelMock = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    };

    connectionMock = {
      createChannel: jest.fn().mockResolvedValue(channelMock),
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    };

    (amqp.connect as jest.Mock).mockResolvedValue(connectionMock);

    configService = {
      get: jest.fn().mockReturnValue('amqp://localhost:5672'),
    } as any;

    service = new RabbitMQService(configService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('lifecycle', () => {
    it('should connect and setup user queues on module init', async () => {
      const setupUserQueuesSpy = jest.spyOn(service as any, 'setupUserQueues').mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost:5672');
      expect(connectionMock.createChannel).toHaveBeenCalled();
      expect(setupUserQueuesSpy).toHaveBeenCalled();
    });

    it('should disconnect on module destroy', async () => {
      // prepara estado conectado
      (service as any).connection = connectionMock;
      (service as any).channel = channelMock;

      await service.onModuleDestroy();

      expect(channelMock.close).toHaveBeenCalled();
      expect(connectionMock.close).toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    it('should connect successfully and setup user queues', async () => {
      const setupUserQueuesSpy = jest.spyOn(service as any, 'setupUserQueues').mockResolvedValue(undefined);

      await (service as any).connect();

      expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost:5672');
      expect(connectionMock.createChannel).toHaveBeenCalled();
      expect(setupUserQueuesSpy).toHaveBeenCalled();
    });

    it('should throw and log on connection error', async () => {
      const connectError = new Error('Connection failed');
      (amqp.connect as jest.Mock).mockRejectedValue(connectError);
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      await expect((service as any).connect()).rejects.toThrow('Connection failed');
      expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to connect to RabbitMQ:', connectError);
    });
  });

  describe('disconnect', () => {
    it('should close channel and connection successfully', async () => {
      (service as any).connection = connectionMock;
      (service as any).channel = channelMock;

      await (service as any).disconnect();

      expect(channelMock.close).toHaveBeenCalled();
      expect(connectionMock.close).toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      (service as any).connection = connectionMock;
      (service as any).channel = channelMock;
      channelMock.close.mockRejectedValue(new Error('Close failed'));
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      await (service as any).disconnect();

      expect(loggerErrorSpy).toHaveBeenCalledWith('Error disconnecting from RabbitMQ:', expect.any(Error));
    });
  });

  describe('setupUserQueues', () => {
    it('should create user exchange and queues with bindings', async () => {
      (service as any).channel = channelMock;

      await (service as any).setupUserQueues();

      // Verifica criação do exchange
      expect(channelMock.assertExchange).toHaveBeenCalledWith('user.exchange', 'topic', { durable: true });

      // Verifica criação das filas
      expect(channelMock.assertQueue).toHaveBeenCalledWith('user.created', { durable: true });
      expect(channelMock.assertQueue).toHaveBeenCalledWith('user.updated', { durable: true });
      expect(channelMock.assertQueue).toHaveBeenCalledWith('user.deleted', { durable: true });

      // Verifica bindings
      expect(channelMock.bindQueue).toHaveBeenCalledWith('user.created', 'user.exchange', 'user.created');
      expect(channelMock.bindQueue).toHaveBeenCalledWith('user.updated', 'user.exchange', 'user.updated');
      expect(channelMock.bindQueue).toHaveBeenCalledWith('user.deleted', 'user.exchange', 'user.deleted');
    });
  });

  describe('publishMessage', () => {
    it('should publish message to exchange with routing key', async () => {
      (service as any).channel = channelMock;

      const message = { userId: '123', action: 'created' };
      await service.publishMessage('user.exchange', 'user.created', message);

      expect(channelMock.publish).toHaveBeenCalledWith(
        'user.exchange',
        'user.created',
        Buffer.from(JSON.stringify(message)),
        expect.objectContaining({
          persistent: true,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should throw and log on publish error', async () => {
      (service as any).channel = channelMock;
      channelMock.publish.mockRejectedValue(new Error('Publish failed'));
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      await expect(service.publishMessage('ex', 'rk', {})).rejects.toThrow('Publish failed');
      expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to publish message:', expect.any(Error));
    });
  });

  describe('user-specific publish methods', () => {
    beforeEach(() => {
      (service as any).channel = channelMock;
      jest.spyOn(service, 'publishMessage').mockResolvedValue(undefined);
    });

    it('should publish user created event', async () => {
      const userData = { id: '123', name: 'John', email: 'john@example.com' };
      const publishMessageSpy = jest.spyOn(service, 'publishMessage');

      await service.publishUserCreated(userData);

      expect(publishMessageSpy).toHaveBeenCalledWith(
        'user.exchange',
        'user.created',
        expect.objectContaining({
          userData,
          timestamp: expect.any(String),
        })
      );
    });

    it('should publish user updated event', async () => {
      const userData = { id: '123', name: 'John Updated', email: 'john@example.com' };
      const publishMessageSpy = jest.spyOn(service, 'publishMessage');

      await service.publishUserUpdated(userData);

      expect(publishMessageSpy).toHaveBeenCalledWith(
        'user.exchange',
        'user.updated',
        expect.objectContaining({
          userData,
          timestamp: expect.any(String),
        })
      );
    });

    it('should publish user deleted event', async () => {
      const userId = '123';
      const publishMessageSpy = jest.spyOn(service, 'publishMessage');

      await service.publishUserDeleted(userId);

      expect(publishMessageSpy).toHaveBeenCalledWith(
        'user.exchange',
        'user.deleted',
        expect.objectContaining({
          userId,
          timestamp: expect.any(String),
        })
      );
    });
  });
});
