import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { i18nValidationExceptionFactory } from '../src/common/pipes/i18n-validation-exception.factory';

describe('Contacts (e2e)', () => {
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

  async function registerAndLogin(email: string) {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Passw0rd1' })
      .expect(201);

    return response.body as { accessToken: string; user: { id: string } };
  }

  it('sends a contact request, accepts it, and shows it in the accepted list for both users', async () => {
    const suffix = Date.now();
    const requesterEmail = `e2e-requester-${suffix}@example.com`;
    const recipientEmail = `e2e-recipient-${suffix}@example.com`;

    const requester = await registerAndLogin(requesterEmail);
    const recipient = await registerAndLogin(recipientEmail);

    const createResponse = await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${requester.accessToken}`)
      .send({ email: recipientEmail })
      .expect(201);

    const contactId = (createResponse.body as { id: string }).id;

    const pendingResponse = await request(app.getHttpServer())
      .get('/contacts')
      .query({ status: 'pending' })
      .set('Authorization', `Bearer ${recipient.accessToken}`)
      .expect(200);

    const pendingList = pendingResponse.body as Array<{ id: string }>;
    expect(pendingList.some((c) => c.id === contactId)).toBe(true);

    await request(app.getHttpServer())
      .patch(`/contacts/${contactId}/accept`)
      .set('Authorization', `Bearer ${recipient.accessToken}`)
      .expect(200);

    const acceptedForRecipientResponse = await request(app.getHttpServer())
      .get('/contacts')
      .query({ status: 'accepted' })
      .set('Authorization', `Bearer ${recipient.accessToken}`)
      .expect(200);

    const acceptedForRecipient = acceptedForRecipientResponse.body as Array<{
      user: { id: string };
    }>;
    expect(
      acceptedForRecipient.some((c) => c.user.id === requester.user.id),
    ).toBe(true);

    const acceptedForRequesterResponse = await request(app.getHttpServer())
      .get('/contacts')
      .query({ status: 'accepted' })
      .set('Authorization', `Bearer ${requester.accessToken}`)
      .expect(200);

    const acceptedForRequester = acceptedForRequesterResponse.body as Array<{
      user: { id: string };
    }>;
    expect(
      acceptedForRequester.some((c) => c.user.id === recipient.user.id),
    ).toBe(true);
  });
});
