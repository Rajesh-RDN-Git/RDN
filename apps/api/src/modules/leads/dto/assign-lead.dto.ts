import { ApiProperty } from '@nestjs/swagger';

export class AssignLeadDto {
  @ApiProperty({ example: 'uuid', description: 'Dealer id to assign/forward this lead to' })
  dealerId!: string;
}
