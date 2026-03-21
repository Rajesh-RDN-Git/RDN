import { ApiProperty } from '@nestjs/swagger';

export class CloseDealDto {
  @ApiProperty({ enum: ['RENT', 'SALE', 'RENEWAL'] })
  type!: string;

  @ApiProperty({ description: 'Deal value amount', minimum: 0 })
  dealValue!: number;
}
