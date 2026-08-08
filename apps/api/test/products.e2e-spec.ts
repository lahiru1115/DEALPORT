import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('Products (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    server = app.getHttpServer();

    const login = await request(server)
      .post('/auth/login')
      .send({ email: 'admin@dealport.com', password: 'Admin@123' }) // gitleaks:allow — seeded demo credential, documented in prisma/seed.ts
      .expect(200);
    token = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('auth', () => {
    it('rejects an unknown email and a wrong password with an identical response', async () => {
      const unknownEmail = await request(server)
        .post('/auth/login')
        .send({ email: 'ghost@dealport.com', password: 'whatever1' }); // gitleaks:allow — placeholder, not a real credential
      const wrongPassword = await request(server)
        .post('/auth/login')
        .send({ email: 'admin@dealport.com', password: 'wrong-password' }); // gitleaks:allow — deliberately wrong password fixture

      expect(unknownEmail.status).toBe(401);
      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
    });

    it('GET /auth/me returns the logged-in admin', async () => {
      const res = await request(server)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.email).toBe('admin@dealport.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('rejects requests with no token', async () => {
      await request(server).get('/auth/me').expect(401);
    });
  });

  describe('GET /products', () => {
    it('rejects unauthenticated requests', async () => {
      await request(server).get('/products').expect(401);
    });

    it('returns a paginated envelope over the seeded catalogue', async () => {
      const res = await request(server)
        .get('/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.meta).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 10,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      );
      expect(res.body.meta.total).toBeGreaterThanOrEqual(26);
      expect(res.body.data).toHaveLength(10);
    });

    it('search finds the seeded iPhone by name', async () => {
      const res = await request(server)
        .get('/products')
        .query({ search: 'iphone' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Apple iPhone 13');
      expect(res.body.data[0].price).toBe('999.00');
    });

    it('status=DRAFT returns only draft products', async () => {
      const res = await request(server)
        .get('/products')
        .query({ status: 'DRAFT' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      for (const product of res.body.data) {
        expect(product.status).toBe('DRAFT');
      }
    });

    it('404s for a nonexistent id', async () => {
      await request(server)
        .get('/products/does-not-exist')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('dashboard widgets', () => {
    it('best-selling is ordered by totalOrders desc, matching the design mock', async () => {
      const res = await request(server)
        .get('/products/best-selling')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const names = res.body.map((product: { name: string }) => product.name);
      expect(names.slice(0, 4)).toEqual([
        'Assorted Cross Bag',
        'T-shirt',
        'Apple iPhone 13',
        'Nike Air Jordan',
      ]);
      expect(res.body[3].stockStatus).toBe('OUT_OF_STOCK');
    });

    it('top products returns the same top 4 by name', async () => {
      const res = await request(server)
        .get('/products/top')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.map((product: { name: string }) => product.name).slice(0, 4)).toEqual([
        'Assorted Cross Bag',
        'T-shirt',
        'Apple iPhone 13',
        'Nike Air Jordan',
      ]);
    });
  });

  describe('product CRUD lifecycle', () => {
    it('rejects an empty payload with per-field validation messages', async () => {
      const res = await request(server)
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(Array.isArray(res.body.message)).toBe(true);
      expect(res.body.message.length).toBeGreaterThan(0);
    });

    it('rejects discountedPrice >= price', async () => {
      await request(server)
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'E2E Bad Discount', price: 10, discountedPrice: 15, stockQuantity: 1 })
        .expect(400);
    });

    it('rejects a missing stockQuantity when unlimitedStock is not set', async () => {
      await request(server)
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'E2E No Stock', price: 10 })
        .expect(400);
    });

    it('creates, reads, publishes, and deletes a product — leaving no residue', async () => {
      const created = await request(server)
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'E2E Lifecycle Widget', price: 25, stockQuantity: 3 })
        .expect(201);

      const id = created.body.id as string;
      expect(created.body.slug).toBe('e2e-lifecycle-widget');
      expect(created.body.sku).toMatch(/^FXZ-\d{4}$/);
      expect(created.body.status).toBe('DRAFT');
      expect(created.body.price).toBe('25.00');

      const fetched = await request(server)
        .get(`/products/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(fetched.body.name).toBe('E2E Lifecycle Widget');

      const published = await request(server)
        .patch(`/products/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'PUBLISHED' })
        .expect(200);
      expect(published.body.status).toBe('PUBLISHED');

      await request(server)
        .delete(`/products/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
      await request(server)
        .get(`/products/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('PATCH/DELETE on a nonexistent id both 404', async () => {
      await request(server)
        .patch('/products/does-not-exist')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'PUBLISHED' })
        .expect(404);
      await request(server)
        .delete('/products/does-not-exist')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('rejects unauthenticated writes', async () => {
      await request(server)
        .post('/products')
        .send({ name: 'Should Fail', price: 1, stockQuantity: 1 })
        .expect(401);
    });
  });
});
