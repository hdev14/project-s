import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/Database";
import SubscriptionPlan, { RecurrenceTypes } from '@subscription/domain/SubscriptionPlan';
import DbSubscriptionPlanRepository from '@subscription/infra/persistence/DbSubscriptionPlanRepository';

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

  describe('DbSubscriptionPlanRepository.getSubscriptionPlans', () => {
    const unique_subscription_plan_id = faker.string.uuid();

    it('returns a list of subscription plans', async () => {
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: unique_subscription_plan_id,
            amount: faker.number.float(),
            recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
            term_url: faker.internet.url(),
            tenant_id: faker.string.uuid(),
            item_id: faker.string.uuid(),
            name: faker.commerce.product(),
          },
          {
            id: unique_subscription_plan_id,
            amount: faker.number.float(),
            recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
            term_url: faker.internet.url(),
            tenant_id: faker.string.uuid(),
            item_id: faker.string.uuid(),
            name: faker.commerce.product(),
          },
          {
            id: faker.string.uuid(),
            amount: faker.number.float(),
            recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
            term_url: faker.internet.url(),
            tenant_id: faker.string.uuid(),
            item_id: faker.string.uuid(),
            name: faker.commerce.product(),
          },
        ]
      });

      const filter = {
        tenant_id: faker.string.uuid(),
      };

      const { results } = await repository.getSubscriptionPlans(filter);

      expect(results).toHaveLength(2);
      expect(results[0].items).toHaveLength(2);
      expect(results[1].items).toHaveLength(1);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT sp.id,sp.amount,sp.recurrence_type,sp.term_url,sp.tenant_id,sp.next_billing_date,sp.created_at,sp.updated_at,ci.id as item_id,ci.name as item_name,ci.created_at as item_created_at,ci.updated_at as item_updated_at FROM subscription_plans sp LEFT JOIN subscription_plan_items spi ON spi.subscription_plan_id = sp.id LEFT JOIN catalog_items ci ON spi.item_id = ci.id WHERE sp.tenant_id=$1',
        [filter.tenant_id],
      );
    });

    it('returns a list of subscription plans when the limit of pagination is 1 and the page is 1', async () => {
      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: unique_subscription_plan_id,
              amount: faker.number.float(),
              recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
              term_url: faker.internet.url(),
              tenant_id: faker.string.uuid(),
              item_id: faker.string.uuid(),
              name: faker.commerce.product(),
            },
            {
              id: unique_subscription_plan_id,
              amount: faker.number.float(),
              recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
              term_url: faker.internet.url(),
              tenant_id: faker.string.uuid(),
              item_id: faker.string.uuid(),
              name: faker.commerce.product(),
            },
          ]
        });

      const filter = {
        tenant_id: faker.string.uuid(),
        page_options: {
          limit: 1,
          page: 1,
        }
      };

      const { results, page_result } = await repository.getSubscriptionPlans(filter);

      expect(results).toHaveLength(1);
      expect(page_result!.next_page).toEqual(2);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT COUNT(id) as total FROM subscription_plans WHERE tenant_id=$1',
        [filter.tenant_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT sp.id,sp.amount,sp.recurrence_type,sp.term_url,sp.tenant_id,sp.next_billing_date,sp.created_at,sp.updated_at,ci.id as item_id,ci.name as item_name,ci.created_at as item_created_at,ci.updated_at as item_updated_at FROM subscription_plans sp LEFT JOIN subscription_plan_items spi ON spi.subscription_plan_id = sp.id LEFT JOIN catalog_items ci ON spi.item_id = ci.id WHERE sp.tenant_id=$1 LIMIT $2 OFFSET $3',
        [filter.tenant_id, filter.page_options.limit, 0],
      );
    });

    it('returns a list of subscription plans when the limit of pagination is 1 and the page is 2', async () => {
      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: unique_subscription_plan_id,
              amount: faker.number.float(),
              recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
              term_url: faker.internet.url(),
              tenant_id: faker.string.uuid(),
              item_id: faker.string.uuid(),
              name: faker.commerce.product(),
            },
            {
              id: unique_subscription_plan_id,
              amount: faker.number.float(),
              recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
              term_url: faker.internet.url(),
              tenant_id: faker.string.uuid(),
              item_id: faker.string.uuid(),
              name: faker.commerce.product(),
            },
          ]
        });

      const filter = {
        tenant_id: faker.string.uuid(),
        page_options: {
          limit: 1,
          page: 2,
        }
      };

      const { results, page_result } = await repository.getSubscriptionPlans(filter);

      expect(results).toHaveLength(1);
      expect(page_result!.next_page).toEqual(-1);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT COUNT(id) as total FROM subscription_plans WHERE tenant_id=$1',
        [filter.tenant_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT sp.id,sp.amount,sp.recurrence_type,sp.term_url,sp.tenant_id,sp.next_billing_date,sp.created_at,sp.updated_at,ci.id as item_id,ci.name as item_name,ci.created_at as item_created_at,ci.updated_at as item_updated_at FROM subscription_plans sp LEFT JOIN subscription_plan_items spi ON spi.subscription_plan_id = sp.id LEFT JOIN catalog_items ci ON spi.item_id = ci.id WHERE sp.tenant_id=$1 LIMIT $2 OFFSET $3',
        [filter.tenant_id, filter.page_options.limit, 1],
      );
    });
  });

  describe('DbSubscriptionPlanRepository.getSubscriptionPlansByIds', () => {
    it('returns a list of subscription plans by ids', async () => {
      query_mock
        .mockResolvedValueOnce({
          rows: [
            {
              id: faker.string.uuid(),
              amount: faker.number.float(),
              recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
              term_url: faker.internet.url(),
              tenant_id: faker.string.uuid(),
              item_id: faker.string.uuid(),
              name: faker.commerce.product(),
            },
            {
              id: faker.string.uuid(),
              amount: faker.number.float(),
              recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
              term_url: faker.internet.url(),
              tenant_id: faker.string.uuid(),
              item_id: faker.string.uuid(),
              name: faker.commerce.product(),
            },
          ]
        });

      const ids = [faker.string.uuid(), faker.string.uuid()];
      const subscription_plans = await repository.getSubscriptionPlansByIds(ids);

      expect(subscription_plans).toHaveLength(2);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT sp.id,sp.amount,sp.recurrence_type,sp.term_url,sp.tenant_id,sp.next_billing_date,sp.created_at,sp.updated_at,ci.id as item_id,ci.name as item_name,ci.created_at as item_created_at,ci.updated_at as item_updated_at FROM subscription_plans sp LEFT JOIN subscription_plan_items spi ON spi.subscription_plan_id = sp.id LEFT JOIN catalog_items ci ON spi.item_id = ci.id WHERE id IN ($1,$2)',
        ids,
      );
    });
  });

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
        'SELECT ci.id,ci.name,ci.created_at,ci.updated_at FROM subscription_plan_items JOIN catalog_items ci ON item_id = ci.id WHERE subscription_plan_id = $1',
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

  describe('DbSubscriptionPlanRepository.createSubscriptionPlan', () => {
    it('should create a new subscription plan', async () => {
      const items = [
        { id: faker.string.uuid(), name: faker.commerce.product() },
        { id: faker.string.uuid(), name: faker.commerce.product() }
      ];

      const subscription_plan_props = {
        id: faker.string.uuid(),
        amount: faker.number.float(),
        tenant_id: faker.string.uuid(),
        items,
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        term_url: faker.internet.url(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      };

      const subscription_plan = new SubscriptionPlan(subscription_plan_props);

      await repository.createSubscriptionPlan(subscription_plan);

      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'INSERT INTO subscription_plans (id,amount,tenant_id,recurrence_type,term_url,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [
          subscription_plan_props.id,
          subscription_plan_props.amount,
          subscription_plan_props.tenant_id,
          subscription_plan_props.recurrence_type,
          subscription_plan_props.term_url,
          subscription_plan_props.created_at,
          subscription_plan_props.updated_at,
        ]
      );;
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'INSERT INTO subscription_plan_items (subscription_plan_id, item_id) VALUES ($1,$2), ($1,$3)',
        [
          subscription_plan_props.id,
          items[0].id,
          items[1].id,
        ]
      );
    });
  });
});
