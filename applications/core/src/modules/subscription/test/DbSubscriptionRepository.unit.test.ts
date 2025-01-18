import { faker } from "@faker-js/faker/locale/pt_BR";
import Database from "@shared/Database";
import Subscription, { SubscriptionProps, SubscriptionStatus } from "@subscription/domain/Subscription";
import DbSubscriptionRepository from "@subscription/infra/persistence/DbSubscriptionRepository";

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

      const subscription_props: SubscriptionProps = {
        id: faker.string.uuid(),
        status: faker.helpers.enumValue(SubscriptionStatus),
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
        started_at: faker.date.future(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      };

      const subscription = new Subscription(subscription_props);

      await repository.createSubscription(subscription);

      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO subscriptions (id,subscriber_id,subscription_plan_id,started_at,status,tenant_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [
          subscription_props.id,
          subscription_props.subscriber_id,
          subscription_props.subscription_plan_id,
          subscription_props.started_at,
          subscription_props.status,
          subscription_props.tenant_id,
          subscription_props.created_at,
          subscription_props.updated_at,
        ],
      );
    });

    it('creates a subscription when started_at is undefined', async () => {
      query_mock
        .mockResolvedValueOnce({});

      const subscription_props: SubscriptionProps = {
        id: faker.string.uuid(),
        status: faker.helpers.enumValue(SubscriptionStatus),
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      };

      const subscription = new Subscription(subscription_props);

      await repository.createSubscription(subscription);

      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO subscriptions (id,subscriber_id,subscription_plan_id,status,tenant_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [
          subscription_props.id,
          subscription_props.subscriber_id,
          subscription_props.subscription_plan_id,
          subscription_props.status,
          subscription_props.tenant_id,
          subscription_props.created_at,
          subscription_props.updated_at,
        ],
      );
    });
  });

  describe('DbSubscriptionRepository.updateSubscription', () => {
    it("updates a subscription", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const subscription_props = {
        id: faker.string.uuid(),
        status: faker.helpers.enumValue(SubscriptionStatus),
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
        started_at: faker.date.future(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      };

      const subscription = new Subscription(subscription_props);

      await repository.updateSubscription(subscription);

      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE subscriptions SET subscriber_id=$2,subscription_plan_id=$3,started_at=$4,status=$5,tenant_id=$6,updated_at=$7 WHERE id = $1',
        [
          subscription_props.id,
          subscription_props.subscriber_id,
          subscription_props.subscription_plan_id,
          subscription_props.started_at,
          subscription_props.status,
          subscription_props.tenant_id,
          subscription_props.updated_at,
        ],
      );
    });

    it("updates a subscription without started_at", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const subscription_props = {
        id: faker.string.uuid(),
        status: faker.helpers.enumValue(SubscriptionStatus),
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      };

      const subscription = new Subscription(subscription_props);

      await repository.updateSubscription(subscription);

      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE subscriptions SET subscriber_id=$2,subscription_plan_id=$3,status=$4,tenant_id=$5,updated_at=$6 WHERE id = $1',
        [
          subscription_props.id,
          subscription_props.subscriber_id,
          subscription_props.subscription_plan_id,
          subscription_props.status,
          subscription_props.tenant_id,
          subscription_props.updated_at,
        ],
      );
    });
  });

  describe('DbSubscriptionRepository.getSubscriptionById', () => {
    it("returns NULL if subscription doesn't exist", async () => {
      query_mock.mockResolvedValueOnce({ rows: [] });

      const subscription_id = faker.string.uuid();
      const subscription = await repository.getSubscriptionById(subscription_id);

      expect(subscription).toBeNull();
      expect(query_mock).toHaveBeenCalledWith('SELECT * FROM subscriptions WHERE id=$1', [subscription_id]);
    });

    it('returns a subscription', async () => {
      const subscription_id = faker.string.uuid();

      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: subscription_id,
            subscriber_id: faker.string.uuid(),
            subscription_plan_id: faker.string.uuid(),
            started_at: faker.date.anytime(),
            status: faker.helpers.enumValue(SubscriptionStatus),
            tenant_id: faker.string.uuid(),

          }
        ]
      });

      const subscription = await repository.getSubscriptionById(subscription_id);

      expect(subscription).toBeInstanceOf(Subscription);
      expect(query_mock).toHaveBeenCalledWith('SELECT * FROM subscriptions WHERE id=$1', [subscription_id]);
    });
  });

  describe('DbSubscriptionRepository.getSubscriptions', () => {
    it('returns a list of subscriptions', async () => {
      const subscriptions = [
        {
          id: faker.string.uuid(),
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          started_at: faker.date.anytime(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          tenant_id: faker.string.uuid(),

        },
        {
          id: faker.string.uuid(),
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          started_at: faker.date.anytime(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          tenant_id: faker.string.uuid(),

        },
      ];

      query_mock.mockResolvedValueOnce({ rows: subscriptions });

      const params = { tenant_id: faker.string.uuid() };

      const page = await repository.getSubscriptions(params);

      expect(page.result).toHaveLength(2);
      expect(page.page_info).toBeUndefined();
      expect(query_mock).toHaveBeenCalledWith('SELECT * FROM subscriptions WHERE tenant_id=$1', [params.tenant_id]);
    });

    it('returns a list of subscriptions filtered by status', async () => {
      const subscriptions = [
        {
          id: faker.string.uuid(),
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          started_at: faker.date.anytime(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          tenant_id: faker.string.uuid(),

        },
        {
          id: faker.string.uuid(),
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          started_at: faker.date.anytime(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          tenant_id: faker.string.uuid(),

        },
      ];

      query_mock.mockResolvedValueOnce({ rows: subscriptions });

      const params = {
        tenant_id: faker.string.uuid(),
        status: faker.helpers.enumValue(SubscriptionStatus)
      };

      const page = await repository.getSubscriptions(params);

      expect(page.result).toHaveLength(2);
      expect(page.page_info).toBeUndefined();
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM subscriptions WHERE tenant_id=$1 AND status=$2',
        [params.tenant_id, params.status]
      );
    });


    it('returns a list of subscriptions when the limit of pagination is 1 and the page is 1', async () => {
      const subscriptions = [
        {
          id: faker.string.uuid(),
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          started_at: faker.date.anytime(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          tenant_id: faker.string.uuid(),

        },
      ];

      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({ rows: subscriptions });

      const params = {
        tenant_id: faker.string.uuid(),
        page_options: {
          limit: 1,
          page: 1,
        }
      };

      const page = await repository.getSubscriptions(params);

      expect(page.result).toHaveLength(1);
      expect(page.page_info!.next_page).toEqual(2);
      expect(page.page_info!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        "SELECT count(id) as total FROM subscriptions WHERE tenant_id=$1",
        [params.tenant_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        "SELECT * FROM subscriptions WHERE tenant_id=$1 LIMIT $2 OFFSET $3",
        [params.tenant_id, params.page_options.limit, 0],
      );
    });

    it('returns a list of subscriptions when the limit of pagination is 1 and the page is 2', async () => {
      const subscriptions = [
        {
          id: faker.string.uuid(),
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          started_at: faker.date.anytime(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          tenant_id: faker.string.uuid(),

        },
      ];

      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({ rows: subscriptions });

      const params = {
        tenant_id: faker.string.uuid(),
        page_options: {
          limit: 1,
          page: 2,
        }
      };

      const page = await repository.getSubscriptions(params);

      expect(page.result).toHaveLength(1);
      expect(page.page_info!.next_page).toEqual(-1);
      expect(page.page_info!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        "SELECT count(id) as total FROM subscriptions WHERE tenant_id=$1",
        [params.tenant_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        "SELECT * FROM subscriptions WHERE tenant_id=$1 LIMIT $2 OFFSET $3",
        [params.tenant_id, params.page_options.limit, 1],
      );
    });

    it('returns a list of subscriptions filtered by status when the limit of pagination is 1 and the page is 1', async () => {
      const subscriptions = [
        {
          id: faker.string.uuid(),
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          started_at: faker.date.anytime(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          tenant_id: faker.string.uuid(),

        },
      ];

      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({ rows: subscriptions });

      const params = {
        tenant_id: faker.string.uuid(),
        status: faker.helpers.enumValue(SubscriptionStatus),
        page_options: {
          limit: 1,
          page: 1,
        }
      };

      const page = await repository.getSubscriptions(params);

      expect(page.result).toHaveLength(1);
      expect(page.page_info!.next_page).toEqual(2);
      expect(page.page_info!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        "SELECT count(id) as total FROM subscriptions WHERE tenant_id=$1 AND status=$2",
        [params.tenant_id, params.status]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        "SELECT * FROM subscriptions WHERE tenant_id=$1 AND status=$2 LIMIT $3 OFFSET $4",
        [params.tenant_id, params.status, params.page_options.limit, 0],
      );
    });
  });
});
