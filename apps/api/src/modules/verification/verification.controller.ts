import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { VerificationService } from './verification.service';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('society/:id')
  @ApiOperation({ summary: 'Verify a society' })
  verifySociety(@Param('id') id: string, @Body() body: any) {
    return this.verificationService.verifySociety(id, body);
  }

  @Post('property/:id')
  @ApiOperation({ summary: 'Verify a property listing' })
  verifyProperty(@Param('id') id: string, @Body() body: any) {
    return this.verificationService.verifyProperty(id, body);
  }

  @Post('dealer/:id')
  @ApiOperation({ summary: 'Verify a dealer profile' })
  verifyDealer(@Param('id') id: string, @Body() body: any) {
    return this.verificationService.verifyDealer(id, body);
  }
}
