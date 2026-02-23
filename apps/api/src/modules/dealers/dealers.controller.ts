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
import { DealersService } from './dealers.service';
import { ApplyDealerDto } from './dto/apply-dealer.dto';
import { QueryDealersDto } from './dto/query-dealers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Dealers')
@Controller('dealers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DealersController {
  constructor(private readonly dealersService: DealersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'RWA_ADMIN')
  @ApiOperation({ summary: 'List dealers' })
  async findAll(@Query() query: QueryDealersDto): Promise<any> {
    return this.dealersService.findAll(query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'RWA_ADMIN', 'DEALER')
  @ApiOperation({ summary: 'Get dealer by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.dealersService.findOne(id);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply to become a dealer' })
  async apply(@Body() body: ApplyDealerDto, @CurrentUser('id') userId: string): Promise<any> {
    return this.dealersService.apply(body, userId);
  }

  @Patch(':id/approve')
  @Roles('SUPER_ADMIN', 'RWA_ADMIN')
  @ApiOperation({ summary: 'Approve dealer application' })
  async approve(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.dealersService.approve(id);
  }

  @Patch(':id/reject')
  @Roles('SUPER_ADMIN', 'RWA_ADMIN')
  @ApiOperation({ summary: 'Reject dealer application' })
  async reject(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.dealersService.reject(id);
  }

  @Patch(':id/kyc')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update dealer KYC status' })
  async updateKyc(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ): Promise<any> {
    return this.dealersService.updateKyc(id, body.status);
  }

  @Patch(':id/training-complete')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Mark dealer training as complete' })
  async completeTraining(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.dealersService.completeTraining(id);
  }
}
