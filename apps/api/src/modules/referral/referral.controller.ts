import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import { QueryReferralsDto } from './dto/query-referrals.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Referral')
@Controller('referrals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get()
  @ApiOperation({ summary: 'List my referrals' })
  async findAll(
    @Query() query: QueryReferralsDto,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    return this.referralService.findAll(query, userId);
  }

  @Post('generate-code')
  @ApiOperation({ summary: 'Generate a referral code' })
  async generateCode(@CurrentUser('id') userId: string): Promise<any> {
    return this.referralService.generateCode(userId);
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate a referral code' })
  async validateCode(@Param('code') code: string): Promise<any> {
    return this.referralService.validateCode(code);
  }

  @Post('apply/:code')
  @ApiOperation({ summary: 'Apply a referral code to current user' })
  async applyCode(@Param('code') code: string, @CurrentUser('id') userId: string): Promise<any> {
    return this.referralService.applyCode(code, userId);
  }
}
