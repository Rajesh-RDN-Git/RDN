import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+919999900001', description: 'Indian phone number with +91 prefix' })
  phone!: string;
}
