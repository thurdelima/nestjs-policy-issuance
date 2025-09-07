import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PricingService } from './services/pricing.service';
import { PricingHistoryService } from './services/pricing-history.service';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../auth/interfaces/user.interface';
import { PricingStatus } from '../../entities/pricing.entity';

@ApiTags('Pricing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    private readonly pricingHistoryService: PricingHistoryService,
  ) {}

  @Post()
  @Roles('admin', 'manager', 'analyst')
  @ApiOperation({ summary: 'Create new pricing' })
  @ApiResponse({ status: 201, description: 'Pricing created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createPricingDto: CreatePricingDto,
    @CurrentUser() user: User,
  ) {
    return this.pricingService.create(createPricingDto, user.id);
  }

  @Get()
  @Roles('admin', 'manager', 'analyst')
  @ApiOperation({ summary: 'Get all pricing records' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, enum: PricingStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'policyId', required: false, type: String, description: 'Filter by policy ID' })
  @ApiResponse({ status: 200, description: 'Pricing records retrieved successfully' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PricingStatus,
    @Query('policyId') policyId?: string,
  ) {
    return this.pricingService.findAll(page, limit, status, policyId);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'analyst')
  @ApiOperation({ summary: 'Get pricing by ID' })
  @ApiParam({ name: 'id', description: 'Pricing ID' })
  @ApiResponse({ status: 200, description: 'Pricing retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Pricing not found' })
  async findOne(@Param('id') id: string) {
    return this.pricingService.findOne(id);
  }

  @Get('policy/:policyId')
  @Roles('admin', 'manager', 'analyst')
  @ApiOperation({ summary: 'Get pricing by policy ID' })
  @ApiParam({ name: 'policyId', description: 'Policy ID' })
  @ApiResponse({ status: 200, description: 'Pricing records retrieved successfully' })
  async findByPolicyId(@Param('policyId') policyId: string) {
    return this.pricingService.findByPolicyId(policyId);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'analyst')
  @ApiOperation({ summary: 'Update pricing' })
  @ApiParam({ name: 'id', description: 'Pricing ID' })
  @ApiResponse({ status: 200, description: 'Pricing updated successfully' })
  @ApiResponse({ status: 404, description: 'Pricing not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async update(
    @Param('id') id: string,
    @Body() updatePricingDto: UpdatePricingDto,
    @CurrentUser() user: User,
  ) {
    return this.pricingService.update(id, updatePricingDto, user.id);
  }

  @Post(':id/approve')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve pricing' })
  @ApiParam({ name: 'id', description: 'Pricing ID' })
  @ApiResponse({ status: 200, description: 'Pricing approved successfully' })
  @ApiResponse({ status: 404, description: 'Pricing not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.pricingService.approve(id, user.id);
  }

  @Post(':id/reject')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject pricing' })
  @ApiParam({ name: 'id', description: 'Pricing ID' })
  @ApiResponse({ status: 200, description: 'Pricing rejected successfully' })
  @ApiResponse({ status: 404, description: 'Pricing not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: User,
  ) {
    return this.pricingService.reject(id, reason, user.id);
  }

  @Post(':id/recalculate')
  @Roles('admin', 'manager', 'analyst')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recalculate pricing' })
  @ApiParam({ name: 'id', description: 'Pricing ID' })
  @ApiResponse({ status: 200, description: 'Pricing recalculated successfully' })
  @ApiResponse({ status: 404, description: 'Pricing not found' })
  async recalculate(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.pricingService.recalculate(id, user.id);
  }

  @Post(':id/deactivate')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate pricing' })
  @ApiParam({ name: 'id', description: 'Pricing ID' })
  @ApiResponse({ status: 200, description: 'Pricing deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Pricing not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.pricingService.deactivate(id, user.id);
  }

  @Get(':id/history')
  @Roles('admin', 'manager', 'analyst')
  @ApiOperation({ summary: 'Get pricing history' })
  @ApiParam({ name: 'id', description: 'Pricing ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Pricing history retrieved successfully' })
  async getHistory(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.pricingHistoryService.getPricingHistory(id, page, limit);
  }
}
