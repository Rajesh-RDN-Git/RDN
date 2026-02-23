import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryNotificationsDto {
  @ApiPropertyOptional({ enum: ['LEAD', 'VISIT', 'DEAL', 'COMMISSION', 'GRIEVANCE', 'SYSTEM'] })
  type?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'], description: 'Filter by read status' })
  unreadOnly?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
