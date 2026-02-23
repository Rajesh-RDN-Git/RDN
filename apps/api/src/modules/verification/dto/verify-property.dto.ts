import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyPropertyDto {
  @ApiProperty({ enum: ['RWA_APPROVED', 'VERIFIED', 'FLAGGED', 'REJECTED'] })
  status!: string;

  @ApiPropertyOptional()
  notes?: string;
}
