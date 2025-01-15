import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/Database";
import { PaymentTypes } from "@subscriber/domain/PaymentMethod";
import Subscriber from "@subscriber/domain/Subscriber";
import DbSubscriberRepository from '@subscriber/infra/persistence/DbSubscriberRepository';

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
          credit_card_external_id: faker.string.uuid(),
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
          credit_card_external_id: faker.string.uuid(),
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

      const page = await repository.getSubscribers();

      expect(page.result).toHaveLength(2);
      const first_subscriber = page.result[0];
      const second_subscriber = page.result[1];
      expect(first_subscriber.toObject().subscriptions).toHaveLength(2);
      expect(second_subscriber.toObject().subscriptions).toHaveLength(1);
      expect(page.page_result).toBeUndefined();
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        "SELECT id,email,document,phone_number,street,district,state,number,complement,payment_type,credit_card_external_id,created_at,updated_at FROM users WHERE type='customer'",
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM subscriptions WHERE subscriber_id IN ($1,$2)',
        [subscribers[0].id, subscribers[1].id]
      );
    });

    it.only('returns a list of subscribers when the limit of pagination is 1 and the page is 1', async () => {
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
          credit_card_external_id: faker.string.uuid(),
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

      const page_options = {
        limit: 1,
        page: 1,
      };

      const page = await repository.getSubscribers({ page_options });

      expect(page.result).toHaveLength(1);
      expect(page.page_result!.next_page).toEqual(2);
      expect(page.page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        "SELECT count(id) as total FROM users WHERE type='customer'",
        []
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        "SELECT id,email,document,phone_number,street,district,state,number,complement,payment_type,credit_card_external_id,created_at,updated_at FROM users WHERE type='customer' LIMIT $1 OFFSET $2",
        [page_options.limit, 0]
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
          credit_card_external_id: faker.string.uuid(),
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

      const page_options = {
        limit: 1,
        page: 2,
      };

      const page = await repository.getSubscribers({ page_options });

      expect(page.result).toHaveLength(1);
      expect(page.page_result!.next_page).toEqual(-1);
      expect(page.page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        "SELECT count(id) as total FROM users WHERE type='customer'",
        []
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        "SELECT id,email,document,phone_number,street,district,state,number,complement,payment_type,credit_card_external_id,created_at,updated_at FROM users WHERE type='customer' LIMIT $1 OFFSET $2",
        [page_options.limit, 1]
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
          credit_card_external_id: faker.string.uuid(),
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
        "SELECT id,email,document,phone_number,street,district,state,number,complement,payment_type,credit_card_external_id,created_at,updated_at FROM users WHERE type='customer' AND id=$1",
        [subscriber_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM subscriptions WHERE subscriber_id=$1',
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
        "SELECT id,email,document,phone_number,street,district,state,number,complement,payment_type,credit_card_external_id,created_at,updated_at FROM users WHERE type='customer' AND id=$1",
        [subscriber_id]
      );
    });
  });

  describe('DbSubscriberRepository.updateSubscriber', () => {
    it("updates a subscriber", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const subscriber = new Subscriber({
        id: faker.string.uuid(),
        address: {
          street: faker.location.street(),
          district: faker.string.sample(),
          number: faker.location.buildingNumber(),
          state: faker.location.state({ abbreviated: true }),
          complement: faker.string.sample(),
        },
        document: faker.string.numeric(11),
        email: faker.internet.email(),
        payment_method: {
          payment_type: faker.helpers.enumValue(PaymentTypes),
          credit_card_external_id: faker.string.uuid(),
        },
        phone_number: faker.string.numeric(11),
        subscriptions: [],
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      });

      const subscriber_obj = subscriber.toObject();

      await repository.updateSubscriber(subscriber);

      expect(query_mock).toHaveBeenCalledWith(
        "UPDATE users SET document=$2,email=$3,phone_number=$4,updated_at=$5,street=$6,district=$7,state=$8,number=$9,complement=$10,payment_type=$11,credit_card_external_id=$12 WHERE type='customer' AND id=$1",
        [
          subscriber_obj.id,
          subscriber_obj.document,
          subscriber_obj.email,
          subscriber_obj.phone_number,
          subscriber_obj.updated_at,
          subscriber_obj.address.street,
          subscriber_obj.address.district,
          subscriber_obj.address.state,
          subscriber_obj.address.number,
          subscriber_obj.address.complement,
          subscriber_obj.payment_method.payment_type,
          subscriber_obj.payment_method.credit_card_external_id,
        ],
      );
    });

    it("updates a subscriber without credit_card_external_id", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const subscriber = new Subscriber({
        id: faker.string.uuid(),
        address: {
          street: faker.location.street(),
          district: faker.string.sample(),
          number: faker.location.buildingNumber(),
          state: faker.location.state({ abbreviated: true }),
          complement: faker.string.sample(),
        },
        document: faker.string.numeric(11),
        email: faker.internet.email(),
        payment_method: {
          payment_type: PaymentTypes.PIX,
        },
        phone_number: faker.string.numeric(11),
        subscriptions: [],
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      });

      const subscriber_obj = subscriber.toObject();

      await repository.updateSubscriber(subscriber);

      expect(query_mock).toHaveBeenCalledWith(
        "UPDATE users SET document=$2,email=$3,phone_number=$4,updated_at=$5,street=$6,district=$7,state=$8,number=$9,complement=$10,payment_type=$11 WHERE type='customer' AND id=$1",
        [
          subscriber_obj.id,
          subscriber_obj.document,
          subscriber_obj.email,
          subscriber_obj.phone_number,
          subscriber_obj.updated_at,
          subscriber_obj.address.street,
          subscriber_obj.address.district,
          subscriber_obj.address.state,
          subscriber_obj.address.number,
          subscriber_obj.address.complement,
          subscriber_obj.payment_method.payment_type,
        ],
      );
    });
  });
});
