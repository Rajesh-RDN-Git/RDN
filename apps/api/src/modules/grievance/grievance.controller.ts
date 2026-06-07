import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { createGrievanceSchema, updateGrievanceSchema } from '@rdn/shared';
import { GrievanceService } from './grievance.service';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import { UpdateGrievanceDto } from './dto/update-grievance.dto';
import { QueryGrievancesDto } from './dto/query-grievances.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Grievance')
@Controller('grievances')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GrievanceController {
  constructor(private readonly grievanceService: GrievanceService) {}

  @Get()
  @ApiOperation({ summary: 'List grievances (admins see all; filers see their own)' })
  async findAll(
    @Query() query: QueryGrievancesDto,
    @CurrentUser() user: { id: string; role: string },
  ): Promise<any> {
    return this.grievanceService.findAll(query, user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get grievance by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.grievanceService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'File a new grievance' })
  async create(
    @Body(new ZodValidationPipe(createGrievanceSchema)) body: CreateGrievanceDto,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    return this.grievanceService.create(body, userId);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'RWA_ADMIN')
  @ApiOperation({ summary: 'Update grievance status' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateGrievanceSchema)) body: UpdateGrievanceDto,
  ): Promise<any> {
    return this.grievanceService.update(id, body);
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Escalate a grievance' })
  async escalate(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.grievanceService.escalate(id);
  }
}
