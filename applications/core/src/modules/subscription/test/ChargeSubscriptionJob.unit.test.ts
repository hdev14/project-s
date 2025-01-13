import { faker } from '@faker-js/faker/locale/pt_BR';
import Queue from '@shared/Queue';
import ChargeSubscriptionJob from '@subscription/app/ChargeSubscriptionJob';
import { SubscriptionPlanRepository } from '@subscription/app/SubscriptionPlanRepository';
import SubscriptionRepository from '@subscription/app/SubscriptionRepository';
import SubscriptionService from "@subscription/app/SubscriptionService";
import { SubscriptionProps, SubscriptionStatus } from '@subscription/domain/Subscription';
import { RecurrenceTypes, SubscriptionPlanProps } from '@subscription/domain/SubscriptionPlan';
import { interfaces } from 'inversify';
import { mock, mockClear, mockFn } from 'jest-mock-extended';

function generateFakeSubscriptionPlans(quantity: number, withProps?: Partial<SubscriptionPlanProps>) {
  const results = [];

  for (let idx = 0; idx < Array.from({ length: quantity }).length; idx++) {
    results.push(Object.assign({
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
      next_billing_date: faker.number.int({ max: 31 }),
    }, withProps));
  }
  return results;
}

function generateFakeSubscriptions(quantity: number, withProps?: Partial<SubscriptionProps>) {
  const results = [];

  for (let idx = 0; idx < Array.from({ length: quantity }).length; idx++) {
    results.push(Object.assign({
      id: faker.string.uuid(),
      status: faker.helpers.enumValue(SubscriptionStatus),
      subscriber_id: faker.string.uuid(),
      subscription_plan_id: faker.string.uuid(),
      tenant_id: faker.string.uuid(),
      created_at: faker.date.future(),
      updated_at: faker.date.future(),
    }, withProps));
  }
  return results;
}

describe('SubscriptionService unit tests', () => {
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
    const subscription_bach_1 = generateFakeSubscriptions(SubscriptionService.SUBSCRIPTION_BATCH_NUMBER, {
      status: SubscriptionStatus.ACTIVE,
    });
    const subscription_bach_2 = generateFakeSubscriptions(SubscriptionService.SUBSCRIPTION_BATCH_NUMBER, {
      status: SubscriptionStatus.ACTIVE,
    });
    const subscription_plan_bach_1 = generateFakeSubscriptionPlans(SubscriptionService.SUBSCRIPTION_BATCH_NUMBER, {
      next_billing_date: new Date(),
    });
    const subscription_plan_batch_2 = generateFakeSubscriptionPlans(SubscriptionService.SUBSCRIPTION_BATCH_NUMBER, {
      next_billing_date: new Date(),
    });

    const subscription_plan_ids_1 = [];
    const subscription_plan_ids_2 = [];

    for (let idx = 0; idx < SubscriptionService.SUBSCRIPTION_BATCH_NUMBER; idx++) {
      subscription_plan_ids_1.push(subscription_plan_bach_1[idx].id);
      subscription_plan_ids_2.push(subscription_plan_batch_2[idx].id);
      subscription_bach_1[idx].subscription_plan_id = subscription_plan_bach_1[idx].id;
      subscription_bach_2[idx].subscription_plan_id = subscription_plan_batch_2[idx].id;
    }

    subscription_repository_mock.getSubscriptions
      .mockResolvedValueOnce({ results: subscription_bach_1, page_result: { next_page: 2, total_of_pages: 2 } })
      .mockResolvedValueOnce({ results: subscription_bach_2, page_result: { next_page: -1, total_of_pages: 2 } });

    subscription_plan_repository_mock.getSubscriptionPlansByIds
      .mockResolvedValueOnce(subscription_plan_bach_1)
      .mockResolvedValueOnce(subscription_plan_batch_2);

    const queue_mock = mock<Queue>();
    queue_constructor_mock.mockReturnValueOnce(queue_mock);

    await job.execute();

    expect(subscription_repository_mock.getSubscriptions).toHaveBeenNthCalledWith(1, {
      status: SubscriptionStatus.ACTIVE,
      page_options: {
        limit: SubscriptionService.SUBSCRIPTION_BATCH_NUMBER,
        page: 1
      }
    });
    expect(subscription_repository_mock.getSubscriptions).toHaveBeenNthCalledWith(2, {
      status: SubscriptionStatus.ACTIVE,
      page_options: {
        limit: SubscriptionService.SUBSCRIPTION_BATCH_NUMBER,
        page: 2
      }
    });
    expect(subscription_plan_repository_mock.getSubscriptionPlansByIds).toHaveBeenNthCalledWith(1, subscription_plan_ids_1);
    expect(subscription_plan_repository_mock.getSubscriptionPlansByIds).toHaveBeenNthCalledWith(2, subscription_plan_ids_2);
    expect(queue_mock.addMessages).toHaveBeenCalledTimes(2);

    const messages_1 = queue_mock.addMessages.mock.calls[0][0];
    const messages_2 = queue_mock.addMessages.mock.calls[1][0];

    for (let idx = 0; idx < SubscriptionService.SUBSCRIPTION_BATCH_NUMBER; idx++) {
      expect(messages_1[idx]).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        payload: {
          subscription_id: subscription_bach_1[idx].id,
          subscriber_id: subscription_bach_1[idx].subscriber_id,
          tenant_id: subscription_bach_1[idx].tenant_id,
          amount: subscription_plan_bach_1[idx].amount,
        }
      });
      expect(messages_2[idx]).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        payload: {
          subscription_id: subscription_bach_2[idx].id,
          subscriber_id: subscription_bach_2[idx].subscriber_id,
          tenant_id: subscription_bach_2[idx].tenant_id,
          amount: subscription_plan_batch_2[idx].amount,
        }
      });
    }
  });
});

