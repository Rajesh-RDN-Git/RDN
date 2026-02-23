import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryDealersDto {
  @ApiPropertyOptional()
  societyId?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  isActive?: string;

  @ApiPropertyOptional({ enum: ['KYC_PENDING', 'KYC_APPROVED', 'KYC_REJECTED'] })
  kycStatus?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
