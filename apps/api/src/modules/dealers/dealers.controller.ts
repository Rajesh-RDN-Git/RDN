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
import { applyDealerSchema, updateDealerKycSchema } from '@rdn/shared';
import { DealersService } from './dealers.service';
import { ApplyDealerDto } from './dto/apply-dealer.dto';
import { QueryDealersDto } from './dto/query-dealers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Dealers')
@Controller('dealers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DealersController {
  constructor(private readonly dealersService: DealersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'RWA_ADMIN')
  @ApiOperation({ summary: 'List dealers (society-scoped for RWA_ADMIN)' })
  async findAll(
    @Query() query: QueryDealersDto,
    @CurrentUser() user: { id: string; role: string },
  ): Promise<any> {
    return this.dealersService.findAll(query, user.id, user.role);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'RWA_ADMIN', 'DEALER')
  @ApiOperation({ summary: 'Get dealer by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.dealersService.findOne(id);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply to become a dealer' })
  async apply(
    @Body(new ZodValidationPipe(applyDealerSchema)) body: ApplyDealerDto,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
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
    @Body(new ZodValidationPipe(updateDealerKycSchema))
    body: { kycStatus: 'APPROVED' | 'REJECTED' },
  ): Promise<any> {
    return this.dealersService.updateKyc(id, body.kycStatus);
  }

  @Patch(':id/training-complete')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Mark dealer training as complete' })
  async completeTraining(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.dealersService.completeTraining(id);
  }

  @Patch(':id/active')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Activate or deactivate a resident dealer' })
  async setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { isActive: boolean },
  ): Promise<any> {
    return this.dealersService.setActive(id, body.isActive);
  }

  @Patch(':id/certify')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Certify a resident dealer (verified societies only)' })
  async certify(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.dealersService.certify(id);
  }

  @Patch(':id/revoke-certification')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Revoke a dealer certification' })
  async revokeCertification(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.dealersService.revokeCertification(id);
  }
}
