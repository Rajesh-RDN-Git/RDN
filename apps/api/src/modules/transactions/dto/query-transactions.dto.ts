import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTransactionsDto {
  @ApiPropertyOptional() page?: string;
  @ApiPropertyOptional() limit?: string;
  @ApiPropertyOptional({ enum: ['RENT', 'SALE', 'RENEWAL'] }) type?: string;
  @ApiPropertyOptional({ enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'] }) paymentStatus?: string;
  @ApiPropertyOptional() from?: string;
  @ApiPropertyOptional() to?: string;
  @ApiPropertyOptional() societyId?: string;
}
