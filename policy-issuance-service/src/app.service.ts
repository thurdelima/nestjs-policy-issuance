import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Policy Issuance Service - Porto Bank Digital';
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'Policy Issuance Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
