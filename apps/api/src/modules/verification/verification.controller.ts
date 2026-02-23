import { Controller, Post, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { VerifySocietyDto } from './dto/verify-society.dto';
import { VerifyPropertyDto } from './dto/verify-property.dto';
import { VerifyDealerDto } from './dto/verify-dealer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Verification')
@Controller('verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('society/:id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Verify a society' })
  async verifySociety(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: VerifySocietyDto,
  ): Promise<any> {
    return this.verificationService.verifySociety(id, body);
  }

  @Post('property/:id')
  @Roles('SUPER_ADMIN', 'RWA_ADMIN')
  @ApiOperation({ summary: 'Verify a property listing' })
  async verifyProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: VerifyPropertyDto,
  ): Promise<any> {
    return this.verificationService.verifyProperty(id, body);
  }

  @Post('dealer/:id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Verify a dealer KYC' })
  async verifyDealer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: VerifyDealerDto,
  ): Promise<any> {
    return this.verificationService.verifyDealer(id, body);
  }
}
