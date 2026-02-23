import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: ['LEAD', 'VISIT', 'DEAL', 'COMMISSION', 'GRIEVANCE', 'SYSTEM'] })
  type!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional({ enum: ['IN_APP', 'PUSH', 'WHATSAPP', 'EMAIL'], default: 'IN_APP' })
  channel?: string;

  @ApiPropertyOptional({ description: 'Additional JSON data' })
  data?: Record<string, unknown>;
}
