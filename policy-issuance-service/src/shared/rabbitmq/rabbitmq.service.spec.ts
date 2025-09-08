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
      assertQueue: jest.fn().mockResolvedValue(undefined),
      sendToQueue: jest.fn().mockReturnValue(true),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
      assertExchange: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
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
      get: jest.fn().mockReturnValue('amqp://admin:admin123@localhost:5672'),
    } as any;

    service = new RabbitMQService(configService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('lifecycle', () => {
    it('should connect on module init', async () => {
      await service.onModuleInit();
      expect(amqp.connect).toHaveBeenCalledWith('amqp://admin:admin123@localhost:5672');
      expect(connectionMock.createChannel).toHaveBeenCalled();
      // registra handlers de erro
      expect(connectionMock.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(channelMock.on).toHaveBeenCalledWith('error', expect.any(Function));
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

  describe('publishMessage', () => {
    it('should assert queue and publish message with default options', async () => {
      (service as any).channel = channelMock;

      const payload = { hello: 'world' };
      const result = await service.publishMessage('queue.test', payload);

      expect(channelMock.assertQueue).toHaveBeenCalledWith('queue.test', { durable: true });
      expect(channelMock.sendToQueue).toHaveBeenCalledWith(
        'queue.test',
        Buffer.from(JSON.stringify(payload)),
        expect.objectContaining({ persistent: true }),
      );
      expect(result).toBe(true);
    });

    it('should merge custom options when publishing', async () => {
      (service as any).channel = channelMock;

      const payload = { id: 1 };
      await service.publishMessage('queue.x', payload, { expiration: '60000' });

      expect(channelMock.sendToQueue).toHaveBeenCalledWith(
        'queue.x',
        expect.any(Buffer),
        expect.objectContaining({ persistent: true, expiration: '60000' }),
      );
    });

    it('should throw and log on publish error', async () => {
      (service as any).channel = channelMock;
      channelMock.assertQueue.mockRejectedValueOnce(new Error('assert error'));

      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      await expect(service.publishMessage('q', { a: 1 })).rejects.toThrow('assert error');
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });

  describe('consumeMessage', () => {
    it('should consume, execute callback and ack on success', async () => {
      (service as any).channel = channelMock;
      let handler: (msg: any) => Promise<void> | void = () => {};
      channelMock.consume.mockImplementation((_q: string, cb: any) => {
        handler = cb;
      });

      const callback = jest.fn().mockResolvedValue(undefined);
      await service.consumeMessage('queue.consume', callback);

      const fakeMsg = { content: Buffer.from(JSON.stringify({ ok: true })) } as any;
      await (handler as any)(fakeMsg);

      expect(callback).toHaveBeenCalledWith({ ok: true });
      expect(channelMock.ack).toHaveBeenCalledWith(fakeMsg);
    });

    it('should nack without requeue on callback error', async () => {
      (service as any).channel = channelMock;
      let handler: (msg: any) => Promise<void> | void = () => {};
      channelMock.consume.mockImplementation((_q: string, cb: any) => {
        handler = cb;
      });

      const callback = jest.fn().mockRejectedValue(new Error('process failed'));
      await service.consumeMessage('queue.consume', callback);

      const fakeMsg = { content: Buffer.from(JSON.stringify({ id: 1 })) } as any;
      await (handler as any)(fakeMsg);

      expect(channelMock.nack).toHaveBeenCalledWith(fakeMsg, false, false);
    });

    it('should throw and log when consume setup fails', async () => {
      (service as any).channel = channelMock;
      channelMock.assertQueue.mockRejectedValueOnce(new Error('consume assert failed'));
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      await expect(service.consumeMessage('q', jest.fn())).rejects.toThrow('consume assert failed');
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });

  describe('exchange and bindings', () => {
    it('should create exchange', async () => {
      (service as any).channel = channelMock;
      await service.createExchange('ex.topic', 'topic');
      expect(channelMock.assertExchange).toHaveBeenCalledWith('ex.topic', 'topic', { durable: true });
    });

    it('should log and throw on exchange creation error', async () => {
      (service as any).channel = channelMock;
      channelMock.assertExchange.mockRejectedValueOnce(new Error('ex error'));
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');
      await expect(service.createExchange('ex', 'fanout')).rejects.toThrow('ex error');
      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should bind queue', async () => {
      (service as any).channel = channelMock;
      await service.bindQueue('q.bind', 'ex.bind', 'route.#');
      expect(channelMock.assertQueue).toHaveBeenCalledWith('q.bind', { durable: true });
      expect(channelMock.bindQueue).toHaveBeenCalledWith('q.bind', 'ex.bind', 'route.#');
    });

    it('should log and throw on bind error', async () => {
      (service as any).channel = channelMock;
      channelMock.assertQueue.mockRejectedValueOnce(new Error('bind assert failed'));
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');
      await expect(service.bindQueue('q', 'ex', 'rk')).rejects.toThrow('bind assert failed');
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });

  describe('accessors', () => {
    it('should return channel and connection', () => {
      (service as any).channel = channelMock;
      (service as any).connection = connectionMock;
      expect(service.getChannel()).toBe(channelMock);
      expect(service.getConnection()).toBe(connectionMock);
    });
  });
});


