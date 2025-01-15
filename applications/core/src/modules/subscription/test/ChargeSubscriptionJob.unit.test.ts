import { faker } from '@faker-js/faker/locale/pt_BR';
import Queue from '@shared/Queue';
import Collection from '@shared/utils/Collection';
import Page from '@shared/utils/Page';
import ChargeSubscriptionJob from '@subscription/app/ChargeSubscriptionJob';
import { SubscriptionPlanRepository } from '@subscription/app/SubscriptionPlanRepository';
import SubscriptionRepository from '@subscription/app/SubscriptionRepository';
import Subscription, { SubscriptionStatus } from '@subscription/domain/Subscription';
import SubscriptionPlan, { RecurrenceTypes } from '@subscription/domain/SubscriptionPlan';
import { interfaces } from 'inversify';
import { mock, mockClear, mockFn } from 'jest-mock-extended';

describe('ChargeSubscriptionJob unit tests', () => {
  const job = new ChargeSubscriptionJob();
  const subscription_repository_mock = mock<SubscriptionRepository>();
  const subscription_plan_repository_mock = mock<SubscriptionPlanRepository>();
  const queue_constructor_mock = mockFn<interfaces.Newable<Queue>>();

  beforeEach(() => {
    job.subscription_repository = subscription_repository_mock;
    job.subscription_plan_repository = subscription_plan_repository_mock;
    job.queue_constructor = queue_constructor_mock;
  });

  afterEach(() => {
    mockClear(subscription_repository_mock);
    mockClear(subscription_plan_repository_mock);
    mockClear(queue_constructor_mock);
  });

  it('should send all current active subscription to the payment queue', async () => {
    const subscription_batch_1 = [];
    const subscription_batch_2 = [];
    const subscription_plan_batch_1 = [];
    const subscription_plan_batch_2 = [];
    const subscription_plan_ids_1 = [];
    const subscription_plan_ids_2 = [];

    for (let idx = 0; idx < 50; idx++) {
      const subscription_plan_1 = new SubscriptionPlan({
        id: faker.string.uuid(),
        items: [{
          id: faker.string.uuid(),
          name: faker.commerce.product(),
          created_at: faker.date.future(),
          updated_at: faker.date.future(),
        }],
        amount: faker.number.float(),
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        term_url: faker.internet.url(),
        tenant_id: faker.string.uuid(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
        next_billing_date: new Date(),
      });

      const subscription_1 = new Subscription({
        id: faker.string.uuid(),
        status: SubscriptionStatus.ACTIVE,
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: subscription_plan_1.id,
        tenant_id: faker.string.uuid(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      });

      const subscription_plan_2 = new SubscriptionPlan({
        id: faker.string.uuid(),
        items: [{
          id: faker.string.uuid(),
          name: faker.commerce.product(),
          created_at: faker.date.future(),
          updated_at: faker.date.future(),
        }],
        amount: faker.number.float(),
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        term_url: faker.internet.url(),
        tenant_id: faker.string.uuid(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
        next_billing_date: new Date(),
      });

      const subscription_2 = new Subscription({
        id: faker.string.uuid(),
        status: SubscriptionStatus.ACTIVE,
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: subscription_plan_2.id,
        tenant_id: faker.string.uuid(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      });

      subscription_batch_1.push(subscription_1);
      subscription_plan_batch_1.push(subscription_plan_1);
      subscription_batch_2.push(subscription_2);
      subscription_plan_batch_2.push(subscription_plan_2);
      subscription_plan_ids_1.push(subscription_plan_1.id);
      subscription_plan_ids_2.push(subscription_plan_2.id);
    }

    subscription_repository_mock.getSubscriptions
      .mockResolvedValueOnce(new Page(subscription_batch_1, { next_page: 2, total_of_pages: 2 }))
      .mockResolvedValueOnce(new Page(subscription_batch_2, { next_page: -1, total_of_pages: 2 }));

    subscription_plan_repository_mock.getSubscriptionPlansByIds
      .mockResolvedValueOnce(new Collection(subscription_plan_batch_1))
      .mockResolvedValueOnce(new Collection(subscription_plan_batch_2));

    const queue_mock = mock<Queue>();
    queue_constructor_mock.mockReturnValueOnce(queue_mock);

    await job.execute();

    expect(subscription_repository_mock.getSubscriptions).toHaveBeenNthCalledWith(1, {
      status: SubscriptionStatus.ACTIVE,
      page_options: {
        limit: 50,
        page: 1
      }
    });
    expect(subscription_repository_mock.getSubscriptions).toHaveBeenNthCalledWith(2, {
      status: SubscriptionStatus.ACTIVE,
      page_options: {
        limit: 50,
        page: 2
      }
    });
    expect(subscription_plan_repository_mock.getSubscriptionPlansByIds).toHaveBeenNthCalledWith(1, subscription_plan_ids_1);
    expect(subscription_plan_repository_mock.getSubscriptionPlansByIds).toHaveBeenNthCalledWith(2, subscription_plan_ids_2);
    expect(queue_mock.addMessages).toHaveBeenCalledTimes(2);

    const messages_1 = queue_mock.addMessages.mock.calls[0][0];
    const messages_2 = queue_mock.addMessages.mock.calls[1][0];

    for (let idx = 0; idx < 50; idx++) {
      const subscription_1 = subscription_batch_1[idx].toObject();
      const subscription_plan_1 = subscription_plan_batch_1[idx].toObject();
      const subscription_2 = subscription_batch_2[idx].toObject();
      const subscription_plan_2 = subscription_plan_batch_2[idx].toObject();

      expect(messages_1[idx]).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        payload: {
          subscription_id: subscription_1.id,
          subscriber_id: subscription_1.subscriber_id,
          tenant_id: subscription_1.tenant_id,
          amount: subscription_plan_1.amount,
        }
      });
      expect(messages_2[idx]).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        payload: {
          subscription_id: subscription_2.id,
          subscriber_id: subscription_2.subscriber_id,
          tenant_id: subscription_2.tenant_id,
          amount: subscription_plan_2.amount,
        }
      });
    }
  });
});

