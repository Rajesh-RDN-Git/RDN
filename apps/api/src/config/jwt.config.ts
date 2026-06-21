import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const isProd = process.env.NODE_ENV === 'production';

  // In production the secrets MUST be provided via env — never fall back to a
  // shared/known dev value. Fail fast on boot if they are missing.
  if (isProd && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
    throw new Error(
      'JWT_SECRET and JWT_REFRESH_SECRET must be set in production — refusing to start.',
    );
  }

  return {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret',
    expiration: process.env.JWT_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
  };
});
