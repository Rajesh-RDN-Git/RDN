import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token obtained from verify-otp or previous refresh' })
  refreshToken!: string;
}
