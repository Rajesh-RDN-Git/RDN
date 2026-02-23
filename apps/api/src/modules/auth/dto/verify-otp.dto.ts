import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+919999900001', description: 'Indian phone number with +91 prefix' })
  phone!: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP' })
  otp!: string;
}
