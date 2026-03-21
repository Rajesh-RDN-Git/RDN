import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Lead ID', format: 'uuid' })
  leadId: string;

  @ApiProperty({ enum: ['RENT', 'SALE', 'RENEWAL'] })
  type: string;

  @ApiProperty({ description: 'Deal value amount', minimum: 0 })
  dealValue: number;
}
