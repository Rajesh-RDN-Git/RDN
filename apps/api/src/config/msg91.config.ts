import { registerAs } from '@nestjs/config';

export default registerAs('msg91', () => ({
  authKey: process.env.MSG91_AUTH_KEY || '',
  senderId: process.env.MSG91_SENDER_ID || 'RDNAPP',
  templateId: process.env.MSG91_TEMPLATE_ID || '',
  otpLength: parseInt(process.env.MSG91_OTP_LENGTH || '6', 10),
  otpExpiry: parseInt(process.env.MSG91_OTP_EXPIRY || '5', 10),
}));
