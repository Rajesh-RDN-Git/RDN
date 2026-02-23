import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeadDto {
  @ApiPropertyOptional({
    enum: [
      'NEW',
      'CONTACTED',
      'VISIT_SCHEDULED',
      'VISITED',
      'NEGOTIATING',
      'CLOSING',
      'CLOSED',
      'LOST',
    ],
  })
  status?: string;

  @ApiPropertyOptional({ example: '2026-03-15T10:00:00.000Z' })
  visitDate?: string;

  @ApiPropertyOptional()
  notes?: Record<string, unknown>;
}
