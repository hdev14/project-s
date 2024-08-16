import AuthModule from '@auth/infra/AuthModule';
import SharedModule from '@shared/infra/SharedModule';
import cleanUpDatabase from '@shared/infra/test_utils/cleanUpDatabase';
import '@shared/infra/test_utils/matchers/toBeNullInDatabase';
import '@shared/infra/test_utils/matchers/toEqualInDatabase';
import SubscriberModule from '@subscriber/infra/SubscriberModule';
import Application from 'src/Application';

describe('Subscriber integration tests', () => {
  const application = new Application({
    modules: [
      new SharedModule(),
      new AuthModule(),
      new SubscriberModule(),
    ]
  });
  // const auth_token_manager = application.container.get<AuthTokenManager>(types.AuthTokenManager);
  // const request = supertest(application.server);

  afterEach(cleanUpDatabase);

  it.todo('POST: /api/subscribers');

  it.todo('GET: /api/subscribers/:subscriber_id');

  it.todo('PATCH: /api/subscribers/:subscriber_id/addresses');

  it.todo('PATCH: /api/subscribers/:subscriber_id/infos');

  it.todo('PATCH: /api/subscribers/:subscriber_id/payment_methods');
});
