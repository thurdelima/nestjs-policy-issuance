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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PolicyService } from './policy.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, User } from '../../auth/decorators/current-user.decorator';
import { PolicyStatus, PolicyType } from '../../entities/policy.entity';

@ApiTags('Policies')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Post()
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Create a new policy' })
  @ApiResponse({ status: 201, description: 'Policy created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createPolicyDto: CreatePolicyDto, @CurrentUser() user: User) {
    return this.policyService.create(createPolicyDto, user.id);
  }

  @Get()
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Get all policies with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, enum: PolicyStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, enum: PolicyType, description: 'Filter by type' })
  @ApiQuery({ name: 'customerId', required: false, type: String, description: 'Filter by customer ID' })
  @ApiResponse({ status: 200, description: 'Policies retrieved successfully' })
  findAll(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: PolicyStatus,
    @Query('type') type?: PolicyType,
    @Query('customerId') customerId?: string,
  ) {
    const filters: any = { status, type, customerId };
    
    if (user.role === 'agent') {
      filters.agentId = user.id;
    }

    return this.policyService.findAll(page, limit, filters);
  }

  @Get('my-policies')
  @ApiOperation({ summary: 'Get current user policies (for customers)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'User policies retrieved successfully' })
  getMyPolicies(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @CurrentUser() user: User,
  ) {
    return this.policyService.findAll(page, limit, { customerId: user.id });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get policy by ID' })
  @ApiResponse({ status: 200, description: 'Policy retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.policyService.findOne(id);
  }

  @Get('number/:policyNumber')
  @ApiOperation({ summary: 'Get policy by policy number' })
  @ApiResponse({ status: 200, description: 'Policy retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  findByPolicyNumber(@Param('policyNumber') policyNumber: string) {
    return this.policyService.findByPolicyNumber(policyNumber);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get policy events' })
  @ApiResponse({ status: 200, description: 'Policy events retrieved successfully' })
  getPolicyEvents(@Param('id', ParseUUIDPipe) id: string) {
    return this.policyService.getPolicyEvents(id);
  }

  @Patch(':id')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Update policy by ID' })
  @ApiResponse({ status: 200, description: 'Policy updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePolicyDto: UpdatePolicyDto,
  ) {
    return this.policyService.update(id, updatePolicyDto);
  }

  @Post(':id/credit-assessment')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Initiate credit assessment for policy' })
  @ApiResponse({ status: 200, description: 'Credit assessment initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid policy status' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  initiateCreditAssessment(@Param('id', ParseUUIDPipe) id: string) {
    return this.policyService.initiateCreditAssessment(id);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Process payment for policy' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid policy status' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  processPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() paymentData: any,
  ) {
    return this.policyService.processPayment(id, paymentData);
  }

  @Post(':id/cancel')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Cancel policy' })
  @ApiResponse({ status: 200, description: 'Policy cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid policy status' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  cancelPolicy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.policyService.cancelPolicy(id, reason);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete policy by ID' })
  @ApiResponse({ status: 200, description: 'Policy deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete active policy' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.policyService.remove(id);
  }
}
