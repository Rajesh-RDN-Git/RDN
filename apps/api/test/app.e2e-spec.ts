import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('RDN API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let buyerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    // Authenticate as super admin (seeded user)
    await request(app.getHttpServer()).post('/v1/auth/send-otp').send({ phone: '+919999900001' });

    const adminRes = await request(app.getHttpServer())
      .post('/v1/auth/verify-otp')
      .send({ phone: '+919999900001', otp: '123456' });

    adminToken = adminRes.body.data?.accessToken;

    // Authenticate as buyer
    await request(app.getHttpServer()).post('/v1/auth/send-otp').send({ phone: '+919999900009' });

    const buyerRes = await request(app.getHttpServer())
      .post('/v1/auth/verify-otp')
      .send({ phone: '+919999900009', otp: '123456' });

    buyerToken = buyerRes.body.data?.accessToken;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /health — should return health status', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('Properties', () => {
    it('GET /v1/properties — should list properties (public)', async () => {
      const res = await request(app.getHttpServer()).get('/v1/properties').expect(200);

      expect(res.body.data.data).toBeInstanceOf(Array);
      expect(res.body.data.total).toBeGreaterThanOrEqual(0);
    });

    it('GET /v1/properties/:id — should return 404 for non-existent property', async () => {
      await request(app.getHttpServer())
        .get('/v1/properties/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('Leads', () => {
    it('GET /v1/leads — should require authentication', async () => {
      await request(app.getHttpServer()).get('/v1/leads').expect(401);
    });

    it('GET /v1/leads — should list leads for authenticated user', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/v1/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.data).toBeInstanceOf(Array);
    });
  });

  describe('Dealers', () => {
    it('GET /v1/dealers — should list dealers (admin)', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/v1/dealers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.data).toBeInstanceOf(Array);
    });
  });

  describe('Search', () => {
    it('GET /v1/search — should search properties', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/search')
        .query({ city: 'Gurgaon' })
        .expect(200);

      expect(res.body.data.data).toBeInstanceOf(Array);
    });
  });

  describe('Notifications', () => {
    it('GET /v1/notifications — should require authentication', async () => {
      await request(app.getHttpServer()).get('/v1/notifications').expect(401);
    });
  });

  describe('Admin', () => {
    it('GET /v1/admin/stats — should return stats for admin', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.totalUsers).toBeDefined();
      expect(res.body.data.totalSocieties).toBeDefined();
    });

    it('GET /v1/admin/stats — should reject for buyer role (RBAC)', async () => {
      if (!buyerToken) return;
      await request(app.getHttpServer())
        .get('/v1/admin/stats')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);
    });
  });

  describe('Commission', () => {
    it('GET /v1/commissions — should require authentication', async () => {
      await request(app.getHttpServer()).get('/v1/commissions').expect(401);
    });
  });

  describe('Transactions', () => {
    it('GET /v1/transactions — should require authentication', async () => {
      await request(app.getHttpServer()).get('/v1/transactions').expect(401);
    });

    it('GET /v1/transactions — should list for admin', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/v1/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.data).toBeInstanceOf(Array);
    });
  });

  describe('Grievances', () => {
    it('GET /v1/grievances — should require authentication', async () => {
      await request(app.getHttpServer()).get('/v1/grievances').expect(401);
    });
  });

  describe('Referrals', () => {
    it('POST /v1/referrals/generate — should generate code for authenticated user', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .post('/v1/referrals/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(res.body.data.code).toMatch(/^RDN-/);
    });
  });
});
