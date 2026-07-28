import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { i18nValidationExceptionFactory } from '../src/common/pipes/i18n-validation-exception.factory';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: i18nValidationExceptionFactory,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers, logs in, and fetches the profile with the issued JWT', async () => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = 'Passw0rd1';

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    const registerBody = registerResponse.body as {
      accessToken: string;
      user: { id: string; email: string };
    };
    expect(registerBody.accessToken).toEqual(expect.any(String));
    expect(registerBody.user.email).toBe(email);
    expect(registerBody.user).not.toHaveProperty('passwordHash');

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const loginBody = loginResponse.body as { accessToken: string };
    expect(loginBody.accessToken).toEqual(expect.any(String));

    const profileResponse = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200);

    const profileBody = profileResponse.body as { email: string };
    expect(profileBody.email).toBe(email);
  });

  it('rejects /users/me without a token', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });
});
