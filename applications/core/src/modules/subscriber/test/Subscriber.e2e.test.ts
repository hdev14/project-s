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

describe('Subscriber E2E tests', () => {
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

  describe('POST: /api/subscribers', () => {
    it('returns status code 400 if data is invalid', async () => {
      const response = await request
        .post('/api/subscribers')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.number.float(),
          document: faker.number.int(),
          phone_number: faker.number.float(),
          address: {
            street: faker.number.float(),
            district: faker.number.float(),
            state: faker.number.float(),
            number: faker.number.float(),
            complement: faker.number.float(),
          }
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(9);
    });

    it('creates a new subscriber', async () => {
      const data = {
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        phone_number: faker.string.numeric(11),
        address: {
          street: faker.location.street(),
          district: faker.string.sample(),
          state: faker.location.state({ abbreviated: true }),
          number: faker.location.buildingNumber(),
          complement: faker.string.sample(),
        }
      };

      const response = await request
        .post('/api/subscribers')
        .set('Content-Type', 'application/json')
        .send(data);

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      await expect({
        email: data.email,
        document: data.document,
        phone_number: data.phone_number,
        street: data.address.street,
        district: data.address.district,
        state: data.address.state,
        number: data.address.number,
        complement: data.address.complement,
      }).toEqualInDatabase('users', response.body.id);
    });
  });

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

  describe('PATCH: /api/subscribers/:subscriber_id/addresses', () => {
    it("returns status code 404 if susbscriber doesn't exist", async () => {
      const response = await request
        .patch(`/api/subscribers/${faker.string.uuid()}/addresses`)
        .set('Content-Type', 'application/json')
        .send({
          street: faker.location.street(),
          district: faker.location.streetAddress(),
          state: faker.location.state({ abbreviated: true }),
          number: faker.string.numeric(2),
          complement: faker.string.sample(),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Assinante não encontrado');
    });

    it('returns status code 400 if data is invalid', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        document: faker.string.numeric(11),
        phone_number: faker.string.numeric(11),
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
        .patch(`/api/subscribers/${subscriber.id}/addresses`)
        .set('Content-Type', 'application/json')
        .send({
          street: faker.number.int(),
          district: faker.number.int(),
          state: faker.number.int(),
          number: faker.number.int(),
          complement: faker.number.int(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(6);
    });

    it("updates the subscriber address", async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        document: faker.string.numeric(11),
        phone_number: faker.string.numeric(11),
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

      const data = {
        street: faker.location.street(),
        district: faker.location.streetAddress(),
        state: faker.location.state({ abbreviated: true }),
        number: faker.string.numeric(2),
        complement: faker.string.sample(),
      };

      const response = await request
        .patch(`/api/subscribers/${subscriber.id}/addresses`)
        .set('Content-Type', 'application/json')
        .send(data);

      expect(response.status).toEqual(204);
      await expect(data).toEqualInDatabase('users', subscriber.id!);
    });
  });

  describe('PATCH: /api/subscribers/:subscriber_id/infos', () => {
    it("returns status code 404 if susbscriber doesn't exist", async () => {
      const response = await request
        .patch(`/api/subscribers/${faker.string.uuid()}/infos`)
        .set('Content-Type', 'application/json')
        .send({
          email: faker.internet.email(),
          document: faker.string.numeric(11),
          phone_number: faker.string.numeric(11),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Assinante não encontrado');
    });

    it('returns status code 400 if data is invalid', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        document: faker.string.numeric(11),
        phone_number: faker.string.numeric(11),
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
        .patch(`/api/subscribers/${subscriber.id}/infos`)
        .set('Content-Type', 'application/json')
        .send({
          email: faker.string.sample(),
          document: faker.number.int(),
          phone_number: faker.number.int(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(3);
    });

    it("updates the subscriber personal info", async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        document: faker.string.numeric(11),
        phone_number: faker.string.numeric(11),
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

      const data = {
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        phone_number: faker.string.numeric(11),
      };

      const response = await request
        .patch(`/api/subscribers/${subscriber.id}/infos`)
        .set('Content-Type', 'application/json')
        .send(data);

      expect(response.status).toEqual(204);
      await expect(data).toEqualInDatabase('users', subscriber.id!);
    });
  });

  describe('PATCH: /api/subscribers/:subscriber_id/payment_methods', () => {
    it("returns status code 404 if susbscriber doesn't exist", async () => {
      const response = await request
        .patch(`/api/subscribers/${faker.string.uuid()}/payment_methods`)
        .set('Content-Type', 'application/json')
        .send({
          payment_type: faker.helpers.enumValue(PaymentTypes),
          credit_card_token: faker.string.alphanumeric(),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Assinante não encontrado');
    });

    it('returns status code 400 if data is invalid', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        document: faker.string.numeric(11),
        phone_number: faker.string.numeric(11),
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
        .patch(`/api/subscribers/${subscriber.id}/payment_methods`)
        .set('Content-Type', 'application/json')
        .send({
          payment_type: faker.string.sample(),
          credit_card_token: faker.number.int(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(2);
    });

    it("updates the subscriber personal info to pix method", async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        document: faker.string.numeric(11),
        phone_number: faker.string.numeric(11),
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

      const data = {
        payment_type: PaymentTypes.PIX,
      };

      const response = await request
        .patch(`/api/subscribers/${subscriber.id}/payment_methods`)
        .set('Content-Type', 'application/json')
        .send(data);

      expect(response.status).toEqual(204);
      await expect(data).toEqualInDatabase('users', subscriber.id!);
    });

    it("updates the subscriber personal info to boleto method", async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        document: faker.string.numeric(11),
        phone_number: faker.string.numeric(11),
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

      const data = {
        payment_type: PaymentTypes.BOLETO,
      };

      const response = await request
        .patch(`/api/subscribers/${subscriber.id}/payment_methods`)
        .set('Content-Type', 'application/json')
        .send(data);

      expect(response.status).toEqual(204);
      await expect(data).toEqualInDatabase('users', subscriber.id!);
    });

    // TODO: test credit card token
    // it("updates the subscriber personal info to credit card method", async () => {
    //   const subscriber = await user_factory.createOne({
    //     id: faker.string.uuid(),
    //     email: faker.internet.email(),
    //     password: faker.string.alphanumeric(10),
    //     document: faker.string.numeric(11),
    //     phone_number: faker.string.numeric(11),
    //     type: UserTypes.CUSTOMER,
    //     address: {
    //       street: faker.location.street(),
    //       district: faker.location.streetAddress(),
    //       state: faker.location.state({ abbreviated: true }),
    //       number: faker.string.numeric(2),
    //       complement: faker.string.sample(),
    //     },
    //     payment_method: {
    //       payment_type: faker.helpers.enumValue(PaymentTypes),
    //       credit_card_external_id: faker.string.uuid(),
    //     }
    //   });

    //   const data = {
    //     payment_type: PaymentTypes.CREDIT_CARD,
    //     credit_card_token: faker.string.alphanumeric(),
    //   };

    //   const response = await request
    //     .patch(`/api/subscribers/${subscriber.id}/infos`)
    //     .set('Content-Type', 'application/json')
    //     .send(data);

    //   expect(response.status).toEqual(204);
    //   await expect(data).toEqualInDatabase('users', subscriber.id!);
    // });
  });
});
