import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';

@ApiTags('Webhooks')
@Controller('api/v1/webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get webhook service statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    return this.webhookService.getServiceStats();
  }

  @Get('payment/:transactionId')
  @ApiOperation({ summary: 'Get payment status by transaction ID' })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentStatus(@Param('transactionId') transactionId: string) {
    const status = await this.webhookService.getPaymentStatus(transactionId);
    
    if (!status) {
      return {
        found: false,
        message: 'Payment not found or not processed yet',
        transactionId,
      };
    }

    return {
      found: true,
      ...status,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Webhook service health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async getHealth() {
    return {
      status: 'healthy',
      service: 'Webhook Manager Service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
