import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifySocietyDto {
  @ApiProperty({ enum: ['VERIFIED', 'FLAGGED', 'REJECTED'] })
  status!: string;

  @ApiPropertyOptional()
  notes?: string;
}
