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
import { CreditAssessmentService } from './credit-assessment.service';
import { CreateCreditAssessmentDto } from './dto/create-credit-assessment.dto';
import { UpdateCreditAssessmentDto } from './dto/update-credit-assessment.dto';
import { AssessmentStatus, AssessmentResult } from '../../entities/credit-assessment.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, User } from '../../auth/decorators/current-user.decorator';

@ApiTags('Credit Assessment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('credit-assessments')
export class CreditAssessmentController {
  constructor(private readonly creditAssessmentService: CreditAssessmentService) {}

  @Post()
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Create a new credit assessment' })
  @ApiResponse({ status: 201, description: 'Credit assessment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Assessment already exists for this policy' })
  create(@Body() createDto: CreateCreditAssessmentDto, @CurrentUser() user: User) {
    return this.creditAssessmentService.create(createDto);
  }

  @Get()
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get all credit assessments with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, enum: AssessmentStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'result', required: false, enum: AssessmentResult, description: 'Filter by result' })
  @ApiQuery({ name: 'customerId', required: false, type: String, description: 'Filter by customer ID' })
  @ApiResponse({ status: 200, description: 'Credit assessments retrieved successfully' })
  findAll(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: AssessmentStatus,
    @Query('result') result?: AssessmentResult,
    @Query('customerId') customerId?: string,
  ) {
    return this.creditAssessmentService.findAll(page, limit, { status, result, customerId });
  }

  @Get(':id')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get credit assessment by ID' })
  @ApiResponse({ status: 200, description: 'Credit assessment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Credit assessment not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.creditAssessmentService.findOne(id);
  }

  @Get('policy/:policyId')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get credit assessment by policy ID' })
  @ApiResponse({ status: 200, description: 'Credit assessment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Credit assessment not found' })
  findByPolicyId(@Param('policyId', ParseUUIDPipe) policyId: string) {
    return this.creditAssessmentService.findByPolicyId(policyId);
  }

  @Get(':id/logs')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get assessment logs' })
  @ApiResponse({ status: 200, description: 'Assessment logs retrieved successfully' })
  getAssessmentLogs(@Param('id', ParseUUIDPipe) id: string) {
    return this.creditAssessmentService.getAssessmentLogs(id);
  }

  @Patch(':id')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Update credit assessment by ID' })
  @ApiResponse({ status: 200, description: 'Credit assessment updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Credit assessment not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateCreditAssessmentDto,
  ) {
    return this.creditAssessmentService.update(id, updateDto);
  }

  @Post(':id/process')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Process credit assessment' })
  @ApiResponse({ status: 200, description: 'Credit assessment processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid assessment status' })
  @ApiResponse({ status: 404, description: 'Credit assessment not found' })
  processAssessment(@Param('id', ParseUUIDPipe) id: string) {
    return this.creditAssessmentService.processAssessment(id);
  }

  @Post(':id/cancel')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Cancel credit assessment' })
  @ApiResponse({ status: 200, description: 'Credit assessment cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel completed assessment' })
  @ApiResponse({ status: 404, description: 'Credit assessment not found' })
  cancelAssessment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.creditAssessmentService.cancelAssessment(id, reason);
  }

  // Note: Delete functionality not implemented for audit purposes
}
