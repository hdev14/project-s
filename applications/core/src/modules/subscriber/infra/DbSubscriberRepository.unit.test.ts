import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/infra/Database";
import { PaymentTypes } from "@subscriber/domain/PaymentMethod";
import Subscriber from "@subscriber/domain/Subscriber";
import DbSubscriberRepository from "./DbSubscriberRepository";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbSubscriberRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbSubscriberRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  describe('DbSubscriberRepository.getSubscribers', () => {
    it('returns a list of subscribers', async () => {
      const subscribers = [
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          document: faker.string.numeric(11),
          phone_number: faker.string.numeric(),
          street: faker.location.street(),
          district: faker.location.streetAddress(),
          state: faker.location.state({ abbreviated: true }),
          number: faker.string.numeric(2),
          complement: faker.string.sample(),
          payment_type: faker.helpers.enumValue(PaymentTypes),
          credit_card_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          document: faker.string.numeric(11),
          phone_number: faker.string.numeric(),
          street: faker.location.street(),
          district: faker.location.streetAddress(),
          state: faker.location.state({ abbreviated: true }),
          number: faker.string.numeric(2),
          complement: faker.string.sample(),
          payment_type: faker.helpers.enumValue(PaymentTypes),
          credit_card_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        }
      ];

      const subscriptions = [
        {
          id: faker.string.uuid(),
          subscriber_id: subscribers[0].id,
          amount: faker.number.float(),
          started_at: faker.date.anytime(),
        },
        {
          id: faker.string.uuid(),
          subscriber_id: subscribers[0].id,
          amount: faker.number.float(),
          started_at: faker.date.anytime(),
        },
        {
          id: faker.string.uuid(),
          subscriber_id: subscribers[1].id,
          amount: faker.number.float(),
          started_at: faker.date.anytime(),
        }
      ];

      query_mock
        .mockResolvedValueOnce({ rows: subscribers })
        .mockResolvedValueOnce({ rows: subscriptions });

      const tenant_id = faker.string.uuid();
      const { results, page_result } = await repository.getSubscribers({ tenant_id });

      expect(results[0]).toBeInstanceOf(Subscriber);
      expect(results).toHaveLength(2);
      const first_subscriber = results[0].toObject();
      const second_subscriber = results[1].toObject();
      expect(first_subscriber.subscriptions).toHaveLength(2);
      expect(second_subscriber.subscriptions).toHaveLength(1);
      expect(page_result).toBeUndefined();
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT id,email,document,phone_number,street,district,state,number,complement,payment_type,credit_card_id,tenant_id FROM users WHERE type=$1 AND tenant_id=$2',
        ['customer', tenant_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM subscriptions WHERE subscriber_id IN ($1,$2)',
        [subscribers[0].id, subscribers[1].id]
      );
    });

    it('returns a list of subscribers when the limit of pagination is 1 and the page is 1', async () => {
      const subscribers = [
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          document: faker.string.numeric(11),
          phone_number: faker.string.numeric(),
          street: faker.location.street(),
          district: faker.location.streetAddress(),
          state: faker.location.state({ abbreviated: true }),
          number: faker.string.numeric(2),
          complement: faker.string.sample(),
          payment_type: faker.helpers.enumValue(PaymentTypes),
          credit_card_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        },
      ];

      const subscriptions = [
        {
          id: faker.string.uuid(),
          subcriber_id: subscribers[0].id,
          amount: faker.number.float(),
          started_at: faker.date.anytime(),
        },
        {
          id: faker.string.uuid(),
          subcriber_id: subscribers[0].id,
          amount: faker.number.float(),
          started_at: faker.date.anytime(),
        }
      ];

      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({ rows: subscribers })
        .mockResolvedValueOnce({ rows: subscriptions });

      const tenant_id = faker.string.uuid();
      const page_options = {
        limit: 1,
        page: 1,
      };

      const { results, page_result } = await repository.getSubscribers({ tenant_id, page_options });

      expect(results[0]).toBeInstanceOf(Subscriber);
      expect(results).toHaveLength(1);
      expect(page_result!.next_page).toEqual(2);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT count(id) as total FROM users WHERE type=$1 AND tenant_id=$2',
        ['customer', tenant_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT id,email,document,phone_number,street,district,state,number,complement,payment_type,credit_card_id,tenant_id FROM users WHERE type=$1 AND tenant_id=$2 LIMIT $3 OFFSET $4',
        ['customer', tenant_id, page_options.limit, 0]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        3,
        'SELECT * FROM subscriptions WHERE subscriber_id IN ($1)',
        [subscribers[0].id]
      );
    });

    it('returns a list of subscribers when the limit of pagination is 1 and the page is 2', async () => {
      const subscribers = [
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          document: faker.string.numeric(11),
          phone_number: faker.string.numeric(),
          street: faker.location.street(),
          district: faker.location.streetAddress(),
          state: faker.location.state({ abbreviated: true }),
          number: faker.string.numeric(2),
          complement: faker.string.sample(),
          payment_type: faker.helpers.enumValue(PaymentTypes),
          credit_card_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        },
      ];

      const subscriptions = [
        {
          id: faker.string.uuid(),
          subcriber_id: subscribers[0].id,
          amount: faker.number.float(),
          started_at: faker.date.anytime(),
        },
        {
          id: faker.string.uuid(),
          subcriber_id: subscribers[0].id,
          amount: faker.number.float(),
          started_at: faker.date.anytime(),
        }
      ];

      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({ rows: subscribers })
        .mockResolvedValueOnce({ rows: subscriptions });

      const tenant_id = faker.string.uuid();
      const page_options = {
        limit: 1,
        page: 2,
      };

      const { results, page_result } = await repository.getSubscribers({ tenant_id, page_options });

      expect(results[0]).toBeInstanceOf(Subscriber);
      expect(results).toHaveLength(1);
      expect(page_result!.next_page).toEqual(-1);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT count(id) as total FROM users WHERE type=$1 AND tenant_id=$2',
        ['customer', tenant_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT id,email,document,phone_number,street,district,state,number,complement,payment_type,credit_card_id,tenant_id FROM users WHERE type=$1 AND tenant_id=$2 LIMIT $3 OFFSET $4',
        ['customer', tenant_id, page_options.limit, 1]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        3,
        'SELECT * FROM subscriptions WHERE subscriber_id IN ($1)',
        [subscribers[0].id]
      );
    });
  });

  describe('DbSubscriberRepository.getSubscriberById', () => {
    it('returns a subscriber by id', async () => {
      const subscribers = [
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          document: faker.string.numeric(11),
          phone_number: faker.string.numeric(),
          street: faker.location.street(),
          district: faker.location.streetAddress(),
          state: faker.location.state({ abbreviated: true }),
          number: faker.string.numeric(2),
          complement: faker.string.sample(),
          payment_type: faker.helpers.enumValue(PaymentTypes),
          credit_card_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        },
      ];

      const subscriptions = [
        {
          id: faker.string.uuid(),
          subscriber_id: subscribers[0].id,
          amount: faker.number.float(),
          started_at: faker.date.anytime(),
        },
        {
          id: faker.string.uuid(),
          subscriber_id: subscribers[0].id,
          amount: faker.number.float(),
          started_at: faker.date.anytime(),
        },
      ];

      query_mock
        .mockResolvedValueOnce({ rows: subscribers })
        .mockResolvedValueOnce({ rows: subscriptions });

      const subscriber_id = faker.string.uuid();
      const subscriber = await repository.getSubcriberById(subscriber_id);

      expect(subscriber).toBeInstanceOf(Subscriber);
      expect(subscriber!.toObject().subscriptions).toHaveLength(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT id,email,document,phone_number,street,district,state,number,complement,payment_type,credit_card_id,tenant_id FROM users WHERE id = $1',
        [subscriber_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM subscriptions WHERE subscriber_id = $1',
        [subscribers[0].id]
      );
    });

    it("returns NULL if subscriber doesn't exist", async () => {
      query_mock
        .mockResolvedValueOnce({ rows: [] });

      const subscriber_id = faker.string.uuid();
      const subscriber = await repository.getSubcriberById(subscriber_id);

      expect(subscriber).toBeNull()
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT id,email,document,phone_number,street,district,state,number,complement,payment_type,credit_card_id,tenant_id FROM users WHERE id = $1',
        [subscriber_id]
      );
    });
  });
});
