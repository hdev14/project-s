import { faker } from "@faker-js/faker/locale/pt_BR";
import Database from "@shared/Database";
import Subscription, { SubscriptionObject, SubscriptionStatus } from "@subscription/domain/Subscription";
import DbSubscriptionRepository from "@subscription/infra/DbSubscriptionRepository";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbSubscriptionRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbSubscriptionRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  describe('DbCommissionRepository.createSubscription', () => {
    it('creates a subscription with all field', async () => {
      query_mock
        .mockResolvedValueOnce({});

      const subscription_obj: SubscriptionObject = {
        id: faker.string.uuid(),
        status: faker.helpers.enumValue(SubscriptionStatus),
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
        started_at: faker.date.future(),
      };

      const subscription = new Subscription(subscription_obj);

      await repository.createSubscription(subscription);

      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO subscriptions (id,subscriber_id,subscription_plan_id,started_at,status,tenant_id) VALUES ($1,$2,$3,$4,$5,$6)',
        [
          subscription_obj.id,
          subscription_obj.subscriber_id,
          subscription_obj.subscription_plan_id,
          subscription_obj.started_at,
          subscription_obj.status,
          subscription_obj.tenant_id,
        ],
      );
    });

    it('creates a subscription when started_at is undefined', async () => {
      query_mock
        .mockResolvedValueOnce({});

      const subscription_obj: SubscriptionObject = {
        id: faker.string.uuid(),
        status: faker.helpers.enumValue(SubscriptionStatus),
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      };

      const subscription = new Subscription(subscription_obj);

      await repository.createSubscription(subscription);

      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO subscriptions (id,subscriber_id,subscription_plan_id,status,tenant_id) VALUES ($1,$2,$3,$4,$5)',
        [
          subscription_obj.id,
          subscription_obj.subscriber_id,
          subscription_obj.subscription_plan_id,
          subscription_obj.status,
          subscription_obj.tenant_id,
        ],
      );
    });
  });

  describe('DbSubscriptionRepository.updateSubscription', () => {
    it("updates a subscription", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const subscription_obj = {
        id: faker.string.uuid(),
        status: faker.helpers.enumValue(SubscriptionStatus),
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
        started_at: faker.date.future(),
      };

      const subscription = new Subscription(subscription_obj);

      await repository.updateSubscription(subscription);

      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE subscriptions SET subscriber_id=$2,subscription_plan_id=$3,started_at=$4,status=$5,tenant_id=$6 WHERE id = $1',
        [
          subscription_obj.id,
          subscription_obj.subscriber_id,
          subscription_obj.subscription_plan_id,
          subscription_obj.started_at,
          subscription_obj.status,
          subscription_obj.tenant_id,
        ],
      );
    });

    it("updates a subscription without started_at", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const subscription_obj = {
        id: faker.string.uuid(),
        status: faker.helpers.enumValue(SubscriptionStatus),
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      };

      const subscription = new Subscription(subscription_obj);

      await repository.updateSubscription(subscription);

      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE subscriptions SET subscriber_id=$2,subscription_plan_id=$3,status=$4,tenant_id=$5 WHERE id = $1',
        [
          subscription_obj.id,
          subscription_obj.subscriber_id,
          subscription_obj.subscription_plan_id,
          subscription_obj.status,
          subscription_obj.tenant_id,
        ],
      );
    });
  });

  it.todo('DbSubscriptionRepository.getSubscriptionById');

  it.todo('DbSubscriptionRepository.getSubscriptions');
});
