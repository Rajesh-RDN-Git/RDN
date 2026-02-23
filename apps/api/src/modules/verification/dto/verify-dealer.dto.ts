import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyDealerDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  kycStatus!: string;

  @ApiPropertyOptional()
  notes?: string;
}
