import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty()
  content!: string;

  @ApiProperty({ enum: ['TEXT', 'IMAGE', 'SYSTEM'], default: 'TEXT' })
  type?: string;
}
