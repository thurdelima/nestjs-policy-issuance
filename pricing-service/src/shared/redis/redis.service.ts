import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const url = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
      
      this.client = createClient({
        url,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
        },
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
        this.logger.log('Disconnected from Redis');
      }
    } catch (error) {
      this.logger.error('Error disconnecting from Redis:', error);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error getting JSON for key ${key}:`, error);
      return null;
    }
  }

  async setJson(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      return await this.set(key, jsonValue, ttl);
    } catch (error) {
      this.logger.error(`Error setting JSON for key ${key}:`, error);
      return false;
    }
  }

  async cachePricingCalculation(policyId: string, pricingData: any, ttl: number = 3600): Promise<boolean> {
    const key = `pricing:calculation:${policyId}`;
    return await this.setJson(key, pricingData, ttl);
  }

  async getCachedPricingCalculation(policyId: string): Promise<any | null> {
    const key = `pricing:calculation:${policyId}`;
    return await this.getJson(key);
  }

  async cachePricingRules(rules: any[], ttl: number = 1800): Promise<boolean> {
    const key = 'pricing:rules:active';
    return await this.setJson(key, rules, ttl);
  }

  async getCachedPricingRules(): Promise<any[] | null> {
    const key = 'pricing:rules:active';
    return await this.getJson(key);
  }

  async invalidatePricingCache(policyId?: string): Promise<boolean> {
    try {
      if (policyId) {
        await this.del(`pricing:calculation:${policyId}`);
      } else {
        const keys = await this.client.keys('pricing:*');
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      }
      return true;
    } catch (error) {
      this.logger.error('Error invalidating pricing cache:', error);
      return false;
    }
  }

  async setSession(sessionId: string, sessionData: any, ttl: number = 86400): Promise<boolean> {
    const key = `session:${sessionId}`;
    return await this.setJson(key, sessionData, ttl);
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    return await this.getJson(key);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`;
    return await this.del(key);
  }
}
