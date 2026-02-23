import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryMessagesDto {
  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  limit?: number;
}
