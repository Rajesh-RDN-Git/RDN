import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { createPropertySchema, updatePropertySchema } from '@rdn/shared';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'List properties with filters' })
  async findAll(@Query() query: QueryPropertiesDto): Promise<any> {
    return this.propertiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'SUPER_ADMIN', 'RWA_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new property listing' })
  @UsePipes(new ZodValidationPipe(createPropertySchema))
  async create(@Body() body: CreatePropertyDto, @CurrentUser('id') userId: string): Promise<any> {
    return this.propertiesService.create(body, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'SUPER_ADMIN', 'RWA_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update property by ID' })
  @UsePipes(new ZodValidationPipe(updatePropertySchema))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePropertyDto,
    @CurrentUser() user: { id: string; role: string },
  ): Promise<any> {
    return this.propertiesService.update(id, body, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'SUPER_ADMIN', 'RWA_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delist property' })
  async delist(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
  ): Promise<any> {
    return this.propertiesService.delist(id, user.id, user.role);
  }
}
