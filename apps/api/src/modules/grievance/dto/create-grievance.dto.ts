import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGrievanceDto {
  @ApiProperty({
    enum: ['DEALER_CONDUCT', 'PROPERTY_MISMATCH', 'COMMISSION', 'SERVICE', 'SAFETY', 'OTHER'],
  })
  category!: string;

  @ApiProperty({ enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] })
  severity!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional()
  againstUserId?: string;

  @ApiPropertyOptional()
  societyId?: string;

  @ApiPropertyOptional()
  transactionId?: string;

  @ApiPropertyOptional({ type: [String] })
  evidenceUrls?: string[];
}
