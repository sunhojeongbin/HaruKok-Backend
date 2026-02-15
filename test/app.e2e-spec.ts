import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

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

  it('/auth/login (POST) fail', () => {
    return request(httpServer())
      .post('/auth/login')
      .send({ email: 'test@gmail.com', password: 'wrong-password' })
      .expect(401);
  });
});
