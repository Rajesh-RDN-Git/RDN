import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryConversationsDto {
  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
