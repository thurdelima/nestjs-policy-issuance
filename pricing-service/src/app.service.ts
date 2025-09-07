import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): object {
    return {
      service: 'Pricing Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  getDetailedHealth(): object {
    return {
      service: 'Pricing Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      dependencies: {
        database: 'connected',
        rabbitmq: 'connected',
        redis: 'connected',
      },
    };
  }
}
