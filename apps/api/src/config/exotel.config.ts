import { registerAs } from '@nestjs/config';

export default registerAs('exotel', () => ({
  apiKey: process.env.EXOTEL_API_KEY || '',
  apiToken: process.env.EXOTEL_API_TOKEN || '',
  sid: process.env.EXOTEL_SID || '',
  callerId: process.env.EXOTEL_CALLER_ID || '',
  subdomain: process.env.EXOTEL_SUBDOMAIN || '',
}));
