import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelCommissionDto {
  @ApiPropertyOptional({ description: 'Reason for cancellation (stored on the record)' })
  reason?: string;
}
