import AuthModule from '@auth/infra/AuthModule';
import { faker } from '@faker-js/faker/locale/pt_BR';
import SharedModule from '@shared/infra/SharedModule';
import cleanUpDatabase from '@shared/infra/test_utils/cleanUpDatabase';
import UserFactory from '@shared/infra/test_utils/factories/UserFactory';
import '@shared/infra/test_utils/matchers/toBeNullInDatabase';
import '@shared/infra/test_utils/matchers/toEqualInDatabase';
import UserTypes from '@shared/UserTypes';
import { PaymentTypes } from '@subscriber/domain/PaymentMethod';
import SubscriberModule from '@subscriber/infra/SubscriberModule';
import Application from 'src/Application';
import supertest from 'supertest';

describe('Subscriber integration tests', () => {
  const application = new Application({
    modules: [
      new SharedModule(),
      new AuthModule(),
      new SubscriberModule(),
    ]
  });
  // const auth_token_manager = application.container.get<AuthTokenManager>(types.AuthTokenManager);
  const request = supertest(application.server);
  const user_factory = new UserFactory();

  afterEach(cleanUpDatabase);

  it.todo('POST: /api/subscribers');

  describe('GET: /api/subscribers/:subscriber_id', () => {
    it("returns status code 404 if subscriber doesn't exist", async () => {
      const response = await request
        .get(`/api/subscribers/${faker.string.uuid()}`)
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Assinante não encontrado');
    });

    it('returns a subscriber', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        document: faker.string.numeric(11),
        type: UserTypes.CUSTOMER,
        address: {
          street: faker.location.street(),
          district: faker.location.streetAddress(),
          state: faker.location.state({ abbreviated: true }),
          number: faker.string.numeric(2),
          complement: faker.string.sample(),
        },
        payment_method: {
          payment_type: faker.helpers.enumValue(PaymentTypes),
          credit_card_external_id: faker.string.uuid(),
        }
      });

      const response = await request
        .get(`/api/subscribers/${subscriber.id}`)
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.id).toEqual(subscriber.id);
      expect(response.body.email).toEqual(subscriber.email);
      expect(response.body.document).toEqual(subscriber.document);
      expect(response.body.address).toEqual(subscriber.address);
    });
  });

  it.todo('PATCH: /api/subscribers/:subscriber_id/addresses');

  it.todo('PATCH: /api/subscribers/:subscriber_id/infos');

  it.todo('PATCH: /api/subscribers/:subscriber_id/payment_methods');
});
