import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { ReferralService } from './referral.service';

@ApiTags('Referral')
@Controller('referrals')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get()
  @ApiOperation({ summary: 'List all referrals' })
  findAll(@Query() query: any) {
    return this.referralService.findAll(query);
  }

  @Post('generate-code')
  @ApiOperation({ summary: 'Generate a referral code' })
  generateCode() {
    return this.referralService.generateCode();
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate a referral code' })
  validateCode(@Param('code') code: string) {
    return this.referralService.validateCode(code);
  }
}
