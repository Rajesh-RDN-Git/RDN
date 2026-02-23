import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'dev-jwt-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret',
  expiration: process.env.JWT_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
}));
