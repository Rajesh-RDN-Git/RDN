import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyDealerDto {
  @ApiProperty({ example: 'uuid', description: 'Society to apply for' })
  societyId!: string;

  @ApiPropertyOptional({ description: 'Bank account details for commission payouts' })
  bankAccountDetails?: Record<string, unknown>;
}
