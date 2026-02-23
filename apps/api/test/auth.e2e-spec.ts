import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('Auth, Users, Societies (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  const testPhone = '+919999900001';
  let accessToken: string;
  let refreshToken: string;

  describe('Auth flow', () => {
    it('POST /v1/auth/send-otp — should send OTP', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/send-otp')
        .send({ phone: testPhone })
        .expect(200);

      expect(res.body.data.message).toBe('OTP sent successfully');
    });

    it('POST /v1/auth/verify-otp — should verify OTP and return tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({ phone: testPhone, otp: '123456' })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.phone).toBe(testPhone);
      expect(res.body.data.user.role).toBe('SUPER_ADMIN');

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('POST /v1/auth/verify-otp — should reject invalid phone', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({ phone: 'invalid', otp: '123456' })
        .expect(400);
    });
  });

  describe('Users', () => {
    it('GET /v1/users/me — should return current user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.name).toBeDefined();
      expect(res.body.data.role).toBe('SUPER_ADMIN');
      // Phone should be masked in profile
      expect(res.body.data.phone).toContain('*');
    });

    it('GET /v1/users/me — should reject without token', async () => {
      await request(app.getHttpServer()).get('/v1/users/me').expect(401);
    });
  });

  describe('Societies', () => {
    it('GET /v1/societies — should list societies (public)', async () => {
      const res = await request(app.getHttpServer()).get('/v1/societies').expect(200);

      expect(res.body.data.data).toBeInstanceOf(Array);
      expect(res.body.data.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Token refresh & logout', () => {
    it('POST /v1/auth/refresh — should return new token pair', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Update tokens for subsequent tests
      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('POST /v1/auth/logout — should revoke refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.message).toBe('Logged out successfully');
    });

    it('POST /v1/auth/refresh — should fail after logout', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });
});
