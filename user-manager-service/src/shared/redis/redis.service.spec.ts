import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

import { createClient } from 'redis';

describe('RedisService', () => {
  let service: RedisService;
  let configService: jest.Mocked<ConfigService>;

  // Mock do cliente Redis
  let clientMock: any;

  beforeEach(() => {
    clientMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      setEx: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(clientMock);

    configService = {
      get: jest.fn().mockReturnValue('redis://localhost:6379'),
    } as any;

    service = new RedisService(configService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('lifecycle', () => {
    it('should connect on module init', async () => {
      await service.onModuleInit();

      expect(createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        socket: {
          reconnectStrategy: expect.any(Function),
        },
      });
      expect(clientMock.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(clientMock.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(clientMock.connect).toHaveBeenCalled();
    });

    it('should disconnect on module destroy', async () => {
      // prepara estado conectado
      (service as any).client = clientMock;

      await service.onModuleDestroy();

      expect(clientMock.quit).toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    it('should connect successfully and register event handlers', async () => {
      await (service as any).connect();

      expect(createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        socket: {
          reconnectStrategy: expect.any(Function),
        },
      });
      expect(clientMock.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(clientMock.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(clientMock.connect).toHaveBeenCalled();
    });

    it('should throw and log on connection error', async () => {
      const connectError = new Error('Connection failed');
      clientMock.connect.mockRejectedValue(connectError);
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      await expect((service as any).connect()).rejects.toThrow('Connection failed');
      expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to connect to Redis:', connectError);
    });
  });

  describe('disconnect', () => {
    it('should quit client successfully', async () => {
      (service as any).client = clientMock;

      await (service as any).disconnect();

      expect(clientMock.quit).toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      (service as any).client = clientMock;
      clientMock.quit.mockRejectedValue(new Error('Quit failed'));
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      await (service as any).disconnect();

      expect(loggerErrorSpy).toHaveBeenCalledWith('Error disconnecting from Redis:', expect.any(Error));
    });
  });

  describe('basic operations', () => {
    beforeEach(() => {
      (service as any).client = clientMock;
    });

    describe('get', () => {
      it('should return value when key exists', async () => {
        clientMock.get.mockResolvedValue('test-value');

        const result = await service.get('test-key');

        expect(clientMock.get).toHaveBeenCalledWith('test-key');
        expect(result).toBe('test-value');
      });

      it('should return null when key does not exist', async () => {
        clientMock.get.mockResolvedValue(null);

        const result = await service.get('missing-key');

        expect(result).toBeNull();
      });

      it('should return null and log error on failure', async () => {
        clientMock.get.mockRejectedValue(new Error('Redis error'));
        const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

        const result = await service.get('error-key');

        expect(result).toBeNull();
        expect(loggerErrorSpy).toHaveBeenCalledWith('Error getting key error-key:', expect.any(Error));
      });
    });

    describe('set', () => {
      it('should set value without TTL', async () => {
        const result = await service.set('key', 'value');

        expect(clientMock.set).toHaveBeenCalledWith('key', 'value');
        expect(clientMock.setEx).not.toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it('should set value with TTL using setEx', async () => {
        const result = await service.set('key', 'value', 3600);

        expect(clientMock.setEx).toHaveBeenCalledWith('key', 3600, 'value');
        expect(clientMock.set).not.toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it('should return false and log error on failure', async () => {
        clientMock.set.mockRejectedValue(new Error('Redis error'));
        const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

        const result = await service.set('key', 'value');

        expect(result).toBe(false);
        expect(loggerErrorSpy).toHaveBeenCalledWith('Error setting key key:', expect.any(Error));
      });
    });

    describe('del', () => {
      it('should delete key successfully', async () => {
        const result = await service.del('key');

        expect(clientMock.del).toHaveBeenCalledWith('key');
        expect(result).toBe(true);
      });

      it('should return false and log error on failure', async () => {
        clientMock.del.mockRejectedValue(new Error('Redis error'));
        const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

        const result = await service.del('key');

        expect(result).toBe(false);
        expect(loggerErrorSpy).toHaveBeenCalledWith('Error deleting key key:', expect.any(Error));
      });
    });
  });

  describe('JSON operations', () => {
    beforeEach(() => {
      (service as any).client = clientMock;
    });

    describe('getJson', () => {
      it('should return parsed JSON when key exists', async () => {
        const jsonValue = '{"name":"John","age":30}';
        clientMock.get.mockResolvedValue(jsonValue);

        const result = await service.getJson('json-key');

        expect(result).toEqual({ name: 'John', age: 30 });
      });

      it('should return null when key does not exist', async () => {
        clientMock.get.mockResolvedValue(null);

        const result = await service.getJson('missing-key');

        expect(result).toBeNull();
      });

      it('should return null and log error on JSON parse failure', async () => {
        clientMock.get.mockResolvedValue('invalid-json');
        const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

        const result = await service.getJson('invalid-key');

        expect(result).toBeNull();
        expect(loggerErrorSpy).toHaveBeenCalledWith('Error getting JSON for key invalid-key:', expect.any(Error));
      });
    });

    describe('setJson', () => {
      it('should stringify and set JSON value without TTL', async () => {
        const setSpy = jest.spyOn(service, 'set').mockResolvedValue(true);
        const jsonValue = { name: 'John', age: 30 };

        const result = await service.setJson('json-key', jsonValue);

        expect(setSpy).toHaveBeenCalledWith('json-key', JSON.stringify(jsonValue), undefined);
        expect(result).toBe(true);
      });

      it('should stringify and set JSON value with TTL', async () => {
        const setSpy = jest.spyOn(service, 'set').mockResolvedValue(true);
        const jsonValue = { name: 'John', age: 30 };

        const result = await service.setJson('json-key', jsonValue, 3600);

        expect(setSpy).toHaveBeenCalledWith('json-key', JSON.stringify(jsonValue), 3600);
        expect(result).toBe(true);
      });

      it('should return false and log error on JSON stringify failure', async () => {
        const circularRef: any = { name: 'John' };
        circularRef.self = circularRef;
        const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

        const result = await service.setJson('json-key', circularRef);

        expect(result).toBe(false);
        expect(loggerErrorSpy).toHaveBeenCalledWith('Error setting JSON for key json-key:', expect.any(Error));
      });
    });
  });

  describe('user-specific cache operations', () => {
    beforeEach(() => {
      (service as any).client = clientMock;
    });

    it('should cache user data with default TTL', async () => {
      const setJsonSpy = jest.spyOn(service, 'setJson').mockResolvedValue(true);
      const userData = { id: '123', name: 'John', email: 'john@example.com' };

      const result = await service.cacheUser('123', userData);

      expect(setJsonSpy).toHaveBeenCalledWith('user:123', userData, 3600);
      expect(result).toBe(true);
    });

    it('should cache user data with custom TTL', async () => {
      const setJsonSpy = jest.spyOn(service, 'setJson').mockResolvedValue(true);
      const userData = { id: '123', name: 'John', email: 'john@example.com' };

      const result = await service.cacheUser('123', userData, 7200);

      expect(setJsonSpy).toHaveBeenCalledWith('user:123', userData, 7200);
      expect(result).toBe(true);
    });

    it('should get cached user data', async () => {
      const getJsonSpy = jest.spyOn(service, 'getJson').mockResolvedValue({ id: '123', name: 'John' });

      const result = await service.getCachedUser('123');

      expect(getJsonSpy).toHaveBeenCalledWith('user:123');
      expect(result).toEqual({ id: '123', name: 'John' });
    });

    it('should invalidate user cache', async () => {
      const delSpy = jest.spyOn(service, 'del').mockResolvedValue(true);

      const result = await service.invalidateUserCache('123');

      expect(delSpy).toHaveBeenCalledWith('user:123');
      expect(result).toBe(true);
    });
  });
});
