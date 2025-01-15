import AuthTokenManager from '@auth/app/AuthTokenManager';
import AuthModule from '@auth/infra/AuthModule';
import { faker } from '@faker-js/faker';
import GlobalModule from '@global/infra/GlobalModule';
import PaymentModule from '@payment/infra/PaymentModule';
import { Policies } from '@shared/Principal';
import cleanUpDatabase from '@shared/test_utils/cleanUpDatabase';
import '@shared/test_utils/matchers/toBeNullInDatabase';
import '@shared/test_utils/matchers/toEqualInDatabase';
import types from '@shared/types';
import SubscriptionModule from '@subscription/infra/SubscriptionModule';
import Application from 'src/Application';
import supertest from 'supertest';

describe('Payment E2E tests', () => {
  const application = new Application({
    modules: [
      new GlobalModule(),
      new AuthModule(),
      new SubscriptionModule(),
      new PaymentModule(),
    ]
  });
  const auth_token_manager = application.container.get<AuthTokenManager>(types.AuthTokenManager);
  const request = supertest(application.server);

  afterEach(cleanUpDatabase);

  describe('GET: /api/payments/subscriptions/:subscription_id', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.CREATE_SUBSCRIBER],
    });

    it.todo("should return all the subscription's payments");
  });

  describe('GET: /api/payments/logs', () => {
    it.todo('should return an array of payment logs paginated');
  });

  describe('POST: /api/payments/webhooks', () => {
    it.todo("should return 404 if payment doesn't exist");
    it.todo('should proccess the payment when the payment was paid');
    it.todo('should proccess the payment when the payment was canceled');
    it.todo('should proccess the payment when the payment was rejected');
    it.todo('should auth the webhook notification');
  });
});
