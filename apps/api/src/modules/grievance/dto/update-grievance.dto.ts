import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGrievanceDto {
  @ApiPropertyOptional({ enum: ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED'] })
  status?: string;

  @ApiPropertyOptional()
  resolutionNotes?: string;

  @ApiPropertyOptional()
  assignedTo?: string;
}
