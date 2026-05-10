import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  otpDevBypass: process.env.OTP_DEV_BYPASS,
}));
