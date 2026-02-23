import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCommissionsDto {
  @ApiPropertyOptional()
  dealerId?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'SETTLED', 'CANCELLED'] })
  status?: string;

  @ApiPropertyOptional({ description: 'From date (ISO string)' })
  from?: string;

  @ApiPropertyOptional({ description: 'To date (ISO string)' })
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
