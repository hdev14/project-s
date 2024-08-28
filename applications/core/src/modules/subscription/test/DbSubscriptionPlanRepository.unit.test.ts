import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/infra/Database";
import SubscriptionPlan, { RecurrenceTypes } from '@subscription/domain/SubscriptionPlan';
import DbSubscriptionPlanRepository from "@subscription/infra/DbSubscriptionPlanRepository";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbSubscriptionPlanRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbSubscriptionPlanRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  it.todo('DbSubscriptionPlanRepository.getSubscriptionPlans');

  describe('DbSubscriptionPlanRepository.getSubscriptionPlanById', () => {
    it('returns a subscription plan', async () => {
      query_mock
        .mockResolvedValueOnce({
          rows: [
            {
              id: faker.string.uuid(),
              amount: faker.number.float(),
              recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
              term_url: faker.internet.url(),
              tenant_id: faker.string.uuid(),
            },
          ]
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: faker.string.uuid(),
              name: faker.commerce.product(),
            },
            {
              id: faker.string.uuid(),
              name: faker.commerce.product(),
            },
          ]
        });

      const subscription_plan_id = faker.string.uuid();
      const subscription_plan = await repository.getSubscriptionPlanById(subscription_plan_id);

      expect(subscription_plan).toBeInstanceOf(SubscriptionPlan);
      expect(subscription_plan!.toObject().items).toHaveLength(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT * FROM subscription_plans WHERE id=$1',
        [subscription_plan_id],
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT ci.id, ci.name FROM subscription_plan_items JOIN catalog_items ci ON item_id = ci.id WHERE subscription_plan_id = $1',
        [subscription_plan_id],
      );
    });

    it("returns NULL if subscription plan doesn't exist", async () => {
      query_mock.mockResolvedValueOnce({ rows: [] });

      const subscription_plan_id = faker.string.uuid();
      const subscription_plan = await repository.getSubscriptionPlanById(subscription_plan_id);

      expect(subscription_plan).toBeNull()
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT * FROM subscription_plans WHERE id=$1',
        [subscription_plan_id],
      );
      expect(query_mock).not.toHaveBeenNthCalledWith(
        2,
        'SELECT ci.id, ci.name FROM subscription_plan_items JOIN catalog_items ci ON item_id = ci.id WHERE subscription_plan_id = $1',
        [subscription_plan_id],
      );
    });
  });

  it.todo('DbSubscriptionPlanRepository.createSubscriptionPlan');
});
