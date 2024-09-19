import { faker } from "@faker-js/faker";
import Payment, { PaymentStatus } from "@payment/domain/Payment";
import DbPaymentRepository from "@payment/infra/persistence/DbPaymentRepository";
import Database from "@shared/Database";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe.skip('DbPaymentRepository unit tests', () => {
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
      const items = [
        { id: faker.string.uuid(), name: faker.commerce.product() },
        { id: faker.string.uuid(), name: faker.commerce.product() }
      ];

      const payment_obj = {
        id: faker.string.uuid(),
        amount: faker.number.float(),
        tax: faker.number.float(),
        status: faker.helpers.enumValue(PaymentStatus),
        subscription_id: faker.string.uuid(),
        customer: {
          id: faker.string.uuid(),
          documnt: faker.string.numeric(11),
          email: faker.internet.email(),
          credit_card_external_id: faker.string.uuid(),
        },
        logs: [{
          id: faker.string.uuid(),
          external_id: faker.string.uuid(),
          payload: JSON.stringify({}),
        }],
      };

      const payment = new Payment(payment_obj);

      await repository.createPayment(payment);

      // expect(query_mock).toHaveBeenNthCalledWith(
      //   1,
      //   'INSERT INTO subscription_plans (id,amount,tenant_id,recurrence_type,term_url) VALUES ($1,$2,$3,$4,$5)',
      //   [
      //     payment_obj.id,
      //     payment_obj.amount,
      //     payment_obj.tenant_id,
      //     payment_obj.recurrence_type,
      //     payment_obj.term_url,
      //   ]
      // );;
      // expect(query_mock).toHaveBeenNthCalledWith(
      //   2,
      //   'INSERT INTO subscription_plan_items (subscription_plan_id, item_id) VALUES ($1,$2), ($1,$3)',
      //   [
      //     payment_obj.id,
      //     items[0].id,
      //     items[1].id,
      //   ]
      // );
    });
  });
});
