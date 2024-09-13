import AuthModule from '@auth/infra/AuthModule';
import GlobalModule from '@global/infra/GlobalModule';
import cleanUpDatabase from '@shared/test_utils/cleanUpDatabase';
import UserFactory from '@shared/test_utils/factories/UserFactory';
import '@shared/test_utils/matchers/toBeNullInDatabase';
import '@shared/test_utils/matchers/toEqualInDatabase';
import SubscriptionModule from '@subscription/infra/SubscriptionModule';
import Application from 'src/Application';
import supertest from 'supertest';

describe('Subscription E2E tests', () => {
  const application = new Application({
    modules: [
      new GlobalModule(),
      new AuthModule(),
      new SubscriptionModule(),
    ]
  });
  // const auth_token_manager = application.container.get<AuthTokenManager>(types.AuthTokenManager);
  const request = supertest(application.server);
  const user_factory = new UserFactory();

  afterEach(cleanUpDatabase);

  it.todo('POST: /api/subscriptions');
  it.todo('PACTH: /api/subscriptions/:subscription_id/activations');
  it.todo('PACTH: /api/subscriptions/:subscription_id/pauses');
  it.todo('PACTH: /api/subscriptions/:subscription_id/cancellations');
  it.todo('POST: /api/subscriptions/plans');
  it.todo('GET: /api/subscriptions/plans');
  it.todo('GET: /api/subscriptions');
});
