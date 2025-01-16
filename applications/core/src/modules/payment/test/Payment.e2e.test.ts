import AuthTokenManager from '@auth/app/AuthTokenManager';
import AuthModule from '@auth/infra/AuthModule';
import { faker } from '@faker-js/faker/locale/pt_BR';
import GlobalModule from '@global/infra/GlobalModule';
import { PaymentStatus } from '@payment/domain/Payment';
import PaymentModule from '@payment/infra/PaymentModule';
import { Policies } from '@shared/Principal';
import cleanUpDatabase from '@shared/test_utils/cleanUpDatabase';
import CatalogItemFactory from '@shared/test_utils/factories/CatalogItemFactory';
import PaymentFactory from '@shared/test_utils/factories/PaymentFactory';
import SubscriptionFactory from '@shared/test_utils/factories/SubscriptionFactory';
import SubscriptionPlanFactory from '@shared/test_utils/factories/SubscriptionPlanFactory';
import UserFactory from '@shared/test_utils/factories/UserFactory';
import '@shared/test_utils/matchers/toBeNullInDatabase';
import '@shared/test_utils/matchers/toEqualInDatabase';
import types from '@shared/types';
import UserTypes from '@shared/UserTypes';
import { SubscriptionStatus } from '@subscription/domain/Subscription';
import { RecurrenceTypes } from '@subscription/domain/SubscriptionPlan';
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
  const subscription_factory = new SubscriptionFactory();
  const user_factory = new UserFactory();
  const subscription_plan_factory = new SubscriptionPlanFactory();
  const payment_factory = new PaymentFactory();
  const catalog_item_factory = new CatalogItemFactory();

  afterEach(cleanUpDatabase);

  describe('GET: /api/payments/subscriptions/:subscription_id', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.LIST_SUBSCRIPTION_PAYMENTS],
    });

    it("should return all the subscription's payments", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY,
      });

      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.CUSTOMER,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.commerce.productDescription() }],
        description: faker.commerce.productDescription(),
        is_service: true,
        name: faker.commerce.productName(),
        tenant_id: company.id!,
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{
          id: catalog_item.id,
          name: catalog_item.name,
        }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const subscription = await subscription_factory.createOne({
        id: faker.string.uuid(),
        status: faker.helpers.enumValue(SubscriptionStatus),
        subscriber_id: subscriber.id!,
        subscription_plan_id: subscription_plan.id!,
        tenant_id: company.id!,
      });

      await payment_factory.createMany([
        {
          id: faker.string.uuid(),
          amount: faker.number.float(),
          status: faker.helpers.enumValue(PaymentStatus),
          subscription_id: subscription.id!,
          tax: faker.number.float(),
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          amount: faker.number.float(),
          status: faker.helpers.enumValue(PaymentStatus),
          subscription_id: subscription.id!,
          tax: faker.number.float(),
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          amount: faker.number.float(),
          status: faker.helpers.enumValue(PaymentStatus),
          subscription_id: subscription.id!,
          tax: faker.number.float(),
          tenant_id: company.id!,
        }
      ]);

      const response = await request
        .get(`/api/payments/subscriptions/${subscription.id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({});

      expect(response.status).toEqual(200);
      expect(response.body).toHaveLength(3);
    });
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
