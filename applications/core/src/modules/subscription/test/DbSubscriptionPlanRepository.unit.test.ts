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
        'SELECT sp.id,sp.amount,sp.recurrence_type,sp.term_url,sp.tenant_id,ci.id as item_id,ci.name as item_name FROM subscription_plans sp LEFT JOIN subscription_plan_items spi ON spi.subscription_plan_id = sp.id LEFT JOIN catalog_items ci ON spi.item_id = ci.id WHERE sp.tenant_id=$1',
        [filter.tenant_id],
      );
    });

    // it.skip('returns a list of subscription plans when the limit of pagination is 1 and the page is 1', async () => {
    //   query_mock
    //     .mockResolvedValueOnce({ rows: [{ total: 2 }] })
    //     .mockResolvedValueOnce({
    //       rows: [
    //         {
    //           id: faker.string.uuid(),
    //           name: faker.commerce.productName(),
    //           description: faker.commerce.productDescription(),
    //           attributes: JSON.stringify([
    //             {
    //               name: faker.commerce.productAdjective(),
    //               description: faker.lorem.lines()
    //             }
    //           ]),
    //           is_service: faker.datatype.boolean(),
    //           picture_url: faker.internet.url(),
    //         },
    //       ]
    //     });

    //   const page_options: PageOptions = {
    //     limit: 1,
    //     page: 1,
    //   };

    //   const { results, page_result } = await repository.getCatalogItems({ page_options });

    //   expect(results).toHaveLength(1);
    //   expect(page_result!.next_page).toEqual(2);
    //   expect(page_result!.total_of_pages).toEqual(2);
    //   expect(query_mock).toHaveBeenNthCalledWith(
    //     1,
    //     'SELECT count(id) as total FROM catalog_items WHERE deleted_at IS NULL',
    //     []
    //   );
    //   expect(query_mock).toHaveBeenNthCalledWith(
    //     2,
    //     'SELECT * FROM catalog_items WHERE deleted_at IS NULL LIMIT $1 OFFSET $2',
    //     [page_options.limit, 0],
    //   );
    // });

    // it.skip('returns a list of subscription plans when the limit of pagination is 1 and the page is 2', async () => {
    //   query_mock
    //     .mockResolvedValueOnce({ rows: [{ total: 2 }] })
    //     .mockResolvedValueOnce({
    //       rows: [
    //         {
    //           id: faker.string.uuid(),
    //           name: faker.commerce.productName(),
    //           description: faker.commerce.productDescription(),
    //           attributes: JSON.stringify([
    //             {
    //               name: faker.commerce.productAdjective(),
    //               description: faker.lorem.lines()
    //             }
    //           ]),
    //           is_service: faker.datatype.boolean(),
    //           picture_url: faker.internet.url(),
    //         },
    //       ]
    //     });

    //   const page_options: PageOptions = {
    //     limit: 1,
    //     page: 2,
    //   };

    //   const { results, page_result } = await repository.getCatalogItems({ page_options });

    //   expect(results).toHaveLength(1);
    //   expect(page_result!.next_page).toEqual(-1);
    //   expect(page_result!.total_of_pages).toEqual(2);
    //   expect(query_mock).toHaveBeenNthCalledWith(
    //     1,
    //     'SELECT count(id) as total FROM catalog_items WHERE deleted_at IS NULL',
    //     []
    //   );
    //   expect(query_mock).toHaveBeenNthCalledWith(
    //     2,
    //     'SELECT * FROM catalog_items WHERE deleted_at IS NULL LIMIT $1 OFFSET $2',
    //     [page_options.limit, 1],
    //   );
    // });
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
