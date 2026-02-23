import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SettleCommissionDto {
  @ApiProperty({ description: 'Payout reference (e.g. Razorpay transfer ID)' })
  payoutReference!: string;

  @ApiPropertyOptional({ description: 'Settlement date (defaults to now)' })
  settlementDate?: string;
}
