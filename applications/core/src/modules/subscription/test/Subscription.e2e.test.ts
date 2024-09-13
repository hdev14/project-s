import AuthModule from '@auth/infra/AuthModule';
import { faker } from '@faker-js/faker/locale/pt_BR';
import GlobalModule from '@global/infra/GlobalModule';
import cleanUpDatabase from '@shared/test_utils/cleanUpDatabase';
import CatalogItemFactory from '@shared/test_utils/factories/CatalogItemFactory';
import SubscriptionPlanFactory from '@shared/test_utils/factories/SubscriptionPlanFactory';
import UserFactory from '@shared/test_utils/factories/UserFactory';
import UserTypes from '@shared/UserTypes';
import SubscriberModule from '@subscriber/infra/SubscriberModule';
import { RecurrenceTypes } from '@subscription/domain/SubscriptionPlan';
import SubscriptionModule from '@subscription/infra/SubscriptionModule';
import Application from 'src/Application';
import supertest from 'supertest';

describe('Subscription E2E tests', () => {
  const application = new Application({
    modules: [
      new GlobalModule(),
      new AuthModule(),
      new SubscriberModule(),
      new SubscriptionModule(),
    ]
  });
  const request = supertest(application.server);
  const user_factory = new UserFactory();
  const subscription_plan_factory = new SubscriptionPlanFactory();
  const catalog_item_factory = new CatalogItemFactory();

  afterEach(cleanUpDatabase);

  describe('POST: /api/subscriptions', () => {
    it("returns status code 404 if subscriber doesn't exist", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const response = await request
        .post('/api/subscriptions')
        .set('Content-Type', 'application/json')
        .send({
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: subscription_plan.id,
          tenant_id: company.id,
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Assinante não encontrado');
    });

    it("returns status code 404 if tenant doesn't exist", async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const response = await request
        .post('/api/subscriptions')
        .set('Content-Type', 'application/json')
        .send({
          subscriber_id: subscriber.id,
          subscription_plan_id: subscription_plan.id,
          tenant_id: faker.string.uuid(),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Empresa não encontrada');
    });

    it("returns status code 404 if subscription plan doesn't exist", async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const response = await request
        .post('/api/subscriptions')
        .set('Content-Type', 'application/json')
        .send({
          subscriber_id: subscriber.id,
          subscription_plan_id: faker.string.uuid(),
          tenant_id: company.id,
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Plano de assinatura não encontrado');
    });
  });

  it.todo('PACTH: /api/subscriptions/:subscription_id/activations');
  it.todo('PACTH: /api/subscriptions/:subscription_id/pauses');
  it.todo('PACTH: /api/subscriptions/:subscription_id/cancellations');
  it.todo('POST: /api/subscriptions/plans');
  it.todo('GET: /api/subscriptions/plans');
  it.todo('GET: /api/subscriptions');
});
