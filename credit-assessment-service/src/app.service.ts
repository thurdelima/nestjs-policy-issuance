import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Credit Assessment Service - Porto Bank Digital';
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'Credit Assessment Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
