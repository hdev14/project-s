import { faker } from "@faker-js/faker";
import Payment, { PaymentStatus } from "@payment/domain/Payment";
import DbPaymentRepository from "@payment/infra/persistence/DbPaymentRepository";
import Database from "@shared/Database";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbPaymentRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbPaymentRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  describe('DbPaymentRepository.createPayment', () => {
    it('should create a new payment', async () => {
      const payment_props = {
        id: faker.string.uuid(),
        amount: faker.number.float(),
        tax: faker.number.float(),
        status: faker.helpers.enumValue(PaymentStatus),
        subscription_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
        created_at: new Date(),
        updated_at: new Date(),
        customer: {
          id: faker.string.uuid(),
          documnt: faker.string.numeric(11),
          email: faker.internet.email(),
          credit_card_external_id: faker.string.uuid(),
        },
      };

      const payment = new Payment(payment_props);

      await repository.createPayment(payment);

      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO payments (id,amount,tax,status,subscription_id,tenant_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [
          payment_props.id,
          payment_props.amount,
          payment_props.tax,
          payment_props.status,
          payment_props.subscription_id,
          payment_props.tenant_id,
          payment_props.created_at,
          payment_props.updated_at,
        ]
      );
    });
  });

  describe('DbPaymentRepository.updatePayment', () => {
    it('should update a payment', async () => {
      const payment_props = {
        id: faker.string.uuid(),
        amount: faker.number.float(),
        tax: faker.number.float(),
        status: faker.helpers.enumValue(PaymentStatus),
        subscription_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
        created_at: new Date(),
        updated_at: new Date(),
        customer: {
          id: faker.string.uuid(),
          documnt: faker.string.numeric(11),
          email: faker.internet.email(),
          credit_card_external_id: faker.string.uuid(),
        },
      };

      const payment = new Payment(payment_props);

      await repository.updatePayment(payment);

      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE payments SET amount=$2,tax=$3,status=$4,subscription_id=$5,updated_at=$6 WHERE id=$1',
        [
          payment_props.id,
          payment_props.amount,
          payment_props.tax,
          payment_props.status,
          payment_props.subscription_id,
          payment_props.updated_at,
        ]
      );
    });
  });

  describe('DbPaymentRepository.getPaymentById', () => {
    it("returns NULL if payment doesn't exist", async () => {
      query_mock.mockResolvedValueOnce({ rows: [] });

      const payment_id = faker.string.uuid();

      const payment = await repository.getPaymentById(payment_id);

      expect(payment).toBeNull();
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT p.id,p.amount,p.status,p.subscription_id,p.tenant_id,p.created_at,p.updated_at,u.id as user_id,u.document,u.email,u.created_at as user_created_at,u.updated_at as user_updated_at FROM payments p JOIN subscriptions s ON p.subscription_id = s.id JOIN users u ON s.subscriber_id = u.id WHERE p.id=$1',
        [payment_id]
      );
    });

    it("returns a payment", async () => {
      const payment_row = {
        id: faker.string.uuid(),
        amount: faker.number.float(),
        tax: faker.number.float(),
        status: faker.helpers.enumValue(PaymentStatus),
        subscription_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
        created_at: new Date(),
        updated_at: new Date(),
        user_id: faker.string.uuid(),
        documnt: faker.string.numeric(11),
        email: faker.internet.email(),
        user_created_at: new Date(),
        user_updated_at: new Date(),
      };
      query_mock
        .mockResolvedValueOnce({
          rows: [payment_row]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: faker.string.uuid(),
            documnt: faker.string.numeric(11),
            email: faker.internet.email(),
            credit_card_external_id: faker.string.uuid(),
            created_at: new Date(),
            updated_at: new Date(),
          }]
        });

      const payment_id = faker.string.uuid();

      const payment = await repository.getPaymentById(payment_id);

      expect(payment).toBeInstanceOf(Payment);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT p.id,p.amount,p.status,p.subscription_id,p.tenant_id,p.created_at,p.updated_at,u.id as user_id,u.document,u.email,u.created_at as user_created_at,u.updated_at as user_updated_at FROM payments p JOIN subscriptions s ON p.subscription_id = s.id JOIN users u ON s.subscriber_id = u.id WHERE p.id=$1',
        [payment_id]
      );
    });
  });

  describe('DbPaymentRepository.getPayments', () => {
    it('returns a list of payments', async () => {
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: faker.string.uuid(),
            amount: faker.number.float(),
            tax: faker.number.float(),
            status: faker.helpers.enumValue(PaymentStatus),
            subscription_id: faker.string.uuid(),
            tenant_id: faker.string.uuid(),
            created_at: new Date(),
            updated_at: new Date(),
            user_id: faker.string.uuid(),
            documnt: faker.string.numeric(11),
            email: faker.internet.email(),
            user_created_at: new Date(),
            user_updated_at: new Date(),
          },
          {
            id: faker.string.uuid(),
            amount: faker.number.float(),
            tax: faker.number.float(),
            status: faker.helpers.enumValue(PaymentStatus),
            subscription_id: faker.string.uuid(),
            tenant_id: faker.string.uuid(),
            created_at: new Date(),
            updated_at: new Date(),
            user_id: faker.string.uuid(),
            documnt: faker.string.numeric(11),
            email: faker.internet.email(),
            user_created_at: new Date(),
            user_updated_at: new Date(),
          }
        ]
      });

      const subscription_id = faker.string.uuid();

      const collection = await repository.getPayments({ subscription_id });

      expect(collection.items).toHaveLength(2);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT p.id,p.amount,p.status,p.subscription_id,p.tenant_id,p.created_at,p.updated_at,u.id as user_id,u.document,u.email,u.created_at as user_created_at,u.updated_at as user_updated_at FROM payments p JOIN subscriptions s ON p.subscription_id = s.id JOIN users u ON s.subscriber_id = u.id WHERE p.subscription_id=$1',
        [subscription_id]
      );
    });

    it("returns a empty list if there is no payments", async () => {
      query_mock.mockResolvedValueOnce({ rows: [] });

      const subscription_id = faker.string.uuid();

      const collection = await repository.getPayments({ subscription_id });

      expect(collection.items).toHaveLength(0);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT p.id,p.amount,p.status,p.subscription_id,p.tenant_id,p.created_at,p.updated_at,u.id as user_id,u.document,u.email,u.created_at as user_created_at,u.updated_at as user_updated_at FROM payments p JOIN subscriptions s ON p.subscription_id = s.id JOIN users u ON s.subscriber_id = u.id WHERE p.subscription_id=$1',
        [subscription_id]
      );
    });
  });
});
