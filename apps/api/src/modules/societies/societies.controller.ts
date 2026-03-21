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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { createSocietySchema, updateSocietySchema } from '@rdn/shared';
import { SocietiesService } from './societies.service';
import { CreateSocietyDto } from './dto/create-society.dto';
import { UpdateSocietyDto } from './dto/update-society.dto';
import { QuerySocietiesDto } from './dto/query-societies.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Societies')
@Controller('societies')
export class SocietiesController {
  constructor(private readonly societiesService: SocietiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all societies (public)' })
  async findAll(@Query() query: QuerySocietiesDto): Promise<any> {
    return this.societiesService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get society by slug (public)' })
  async findBySlug(@Param('slug') slug: string): Promise<any> {
    return this.societiesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new society (super admin only)' })
  @UsePipes(new ZodValidationPipe(createSocietySchema))
  async create(@Body() body: CreateSocietyDto): Promise<any> {
    return this.societiesService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update society by ID' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateSocietySchema)) body: UpdateSocietyDto,
    @CurrentUser() user: { id: string; role: string; societyId?: string },
  ): Promise<any> {
    // SUPER_ADMIN can update any; RWA_ADMIN can update their own society only
    if (user.role === 'RWA_ADMIN' && user.societyId !== id) {
      throw new ForbiddenException('You can only update your own society');
    }
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'RWA_ADMIN') {
      throw new ForbiddenException('Insufficient permissions');
    }
    return this.societiesService.update(id, body);
  }
}
