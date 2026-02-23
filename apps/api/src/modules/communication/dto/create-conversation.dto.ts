import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ description: 'Lead ID to link this conversation to' })
  leadId!: string;

  @ApiProperty({ description: 'User ID of the other participant' })
  participantId!: string;

  @ApiPropertyOptional({ description: 'Initial message content' })
  message?: string;
}
