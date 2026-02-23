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
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { createLeadSchema, updateLeadSchema } from '@rdn/shared';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Leads')
@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List leads (scoped by role)' })
  async findAll(
    @Query() query: QueryLeadsDto,
    @CurrentUser() user: { id: string; role: string },
  ): Promise<any> {
    return this.leadsService.findAll(query, user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.leadsService.findOne(id);
  }

  @Post()
  @Roles('BUYER_TENANT', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a lead (buyer enquiry)' })
  @UsePipes(new ZodValidationPipe(createLeadSchema))
  async create(@Body() body: CreateLeadDto, @CurrentUser('id') userId: string): Promise<any> {
    return this.leadsService.create(body, userId);
  }

  @Patch(':id')
  @Roles('DEALER', 'SUPER_ADMIN', 'RWA_ADMIN')
  @ApiOperation({ summary: 'Update lead status' })
  @UsePipes(new ZodValidationPipe(updateLeadSchema))
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateLeadDto): Promise<any> {
    return this.leadsService.update(id, body);
  }

  @Patch(':id/approve-visit')
  @Roles('OWNER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Owner approves a visit request' })
  async approveVisit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    return this.leadsService.approveVisit(id, userId);
  }
}
