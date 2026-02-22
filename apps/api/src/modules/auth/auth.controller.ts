import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to phone number' })
  sendOtp(@Body() body: { phone: string }) {
    return this.authService.sendOtp(body.phone);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and get tokens' })
  verifyOtp(@Body() body: { phone: string; otp: string }) {
    return this.authService.verifyOtp(body.phone, body.otp);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }
}
