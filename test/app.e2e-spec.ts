import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

function hasAccessToken(
  value: unknown,
): value is { data: { accessToken: string } } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = (value as { data?: unknown }).data;
  if (!data || typeof data !== 'object') {
    return false;
  }

  return typeof (data as { accessToken?: unknown }).accessToken === 'string';
}

describe('Auth (e2e)', () => {
  let app: INestApplication;

  const httpServer = (): App => app.getHttpServer() as App;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/login (POST) success', async () => {
    await request(httpServer())
      .post('/auth/login')
      .send({ email: 'test@gmail.com', password: '1234' })
      .expect(200);
  });

  it('/auth/refresh (POST) success', async () => {
    const loginResponse = await request(httpServer())
      .post('/auth/login')
      .send({ email: 'test@gmail.com', password: '1234' })
      .expect(200);

    const setCookieHeader = loginResponse.headers['set-cookie'] as
      | string
      | string[]
      | undefined;
    const setCookie = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : setCookieHeader
        ? [setCookieHeader]
        : [];
    expect(setCookie.length).toBeGreaterThan(0);

    const refreshTokenCookie = setCookie?.find((cookie) =>
      cookie.startsWith('refreshToken='),
    );
    expect(refreshTokenCookie).toBeDefined();

    const refreshResponse = await request(httpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshTokenCookie)
      .expect(200);

    expect(hasAccessToken(refreshResponse.body)).toBe(true);
  });

  it('/auth/refresh (POST) fail when cookie missing', () => {
    return request(httpServer()).post('/auth/refresh').expect(401);
  });

  it('/auth/logout (POST) success and invalidate refresh token', async () => {
    const loginResponse = await request(httpServer())
      .post('/auth/login')
      .send({ email: 'test@gmail.com', password: '1234' })
      .expect(200);

    const setCookieHeader = loginResponse.headers['set-cookie'] as
      | string
      | string[]
      | undefined;
    const setCookie = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : setCookieHeader
        ? [setCookieHeader]
        : [];
    const refreshTokenCookie = setCookie.find((cookie) =>
      cookie.startsWith('refreshToken='),
    );
    expect(refreshTokenCookie).toBeDefined();

    await request(httpServer())
      .post('/auth/logout')
      .set('Cookie', refreshTokenCookie)
      .expect(200);

    await request(httpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshTokenCookie)
      .expect(401);
  });

  it('/auth/login (POST) fail', () => {
    return request(httpServer())
      .post('/auth/login')
      .send({ email: 'test@gmail.com', password: 'wrong-password' })
      .expect(401);
  });
});
