import { faker } from "@faker-js/faker";
import PaymentGateway from "@payment/app/PaymentGateway";
import PaymentLogRepository from "@payment/app/PaymentLogRepository";
import PaymentRepository from "@payment/app/PaymentRepository";
import PaymentService from "@payment/app/PaymentService";
import { PaymentStatus } from "@payment/domain/Payment";
import NotFoundError from "@shared/errors/NotFoundError";
import Mediator from "@shared/Mediator";
import { mock } from "jest-mock-extended";

describe('PaymentService unit tests', () => {
  const payment_repository_mock = mock<PaymentRepository>();
  const payment_log_repository_mock = mock<PaymentLogRepository>();
  const mediator_mock = mock<Mediator>();
  const payment_gateway_mock = mock<PaymentGateway>();
  const payment_service = new PaymentService(
    payment_repository_mock,
    payment_log_repository_mock,
    mediator_mock,
    payment_gateway_mock,
  );

  describe('PaymentService.getSubscriptionPayments', () => {
    it("should return a list of subscription's payments", async () => {
      payment_repository_mock.getPayments.mockResolvedValueOnce([
        {
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
            created_at: new Date(),
            updated_at: new Date(),
          }
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
          customer: {
            id: faker.string.uuid(),
            documnt: faker.string.numeric(11),
            email: faker.internet.email(),
            created_at: new Date(),
            updated_at: new Date(),
          }
        },
      ]);

      const subscription_id = faker.string.uuid()
      const [error, data] = await payment_service.getSubscriptionPayments({ subscription_id });

      expect(error).toBeUndefined();
      expect(data).toHaveLength(2);
    });
  });

  describe('PaymentService.getPaymentLogs', () => {
    it('should return a result with payment logs and page result', async () => {
      payment_log_repository_mock.getPaymentLogs.mockResolvedValueOnce({
        results: [{
          id: faker.string.uuid(),
          external_id: faker.string.uuid(),
          payment_id: faker.string.uuid(),
          payload: JSON.stringify({}),
        }],
        page_result: {
          next_page: 2,
          total_of_pages: 2,
        }
      });

      const params = {
        payment_id: faker.string.uuid(),
        page_options: {
          limit: faker.number.int(),
          page: faker.number.int(),
        }
      };

      const [error, data] = await payment_service.getPaymentLogs(params);

      expect(error).toBeUndefined();
      expect(data!.results).toHaveLength(1);
      expect(data!.page_result).toEqual({
        next_page: 2,
        total_of_pages: 2,
      });
    })
  });

  describe('PaymentService.createPayment', () => {
    it("should return a not found error if subscriber doesn't exist", async () => {
      mediator_mock.send.mockResolvedValueOnce(null);

      const [error, data] = await payment_service.createPayment({
        amount: faker.number.float(),
        customer_id: faker.string.uuid(),
        subscription_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.subscriber');
    });

    it('creates a new pending payment after call PaymentGateway.makeTransaction method', async () => {
      mediator_mock.send.mockResolvedValueOnce({
        id: faker.string.uuid(),
        document: faker.string.numeric(11),
        email: faker.internet.email(),
        payment_method: {
          payment_type: faker.helpers.arrayElement(['credit_card', 'pix', 'boleto']),
          credit_card_external_id: faker.string.uuid(),
        },
      });

      const [error, data] = await payment_service.createPayment({
        amount: faker.number.float(),
        customer_id: faker.string.uuid(),
        subscription_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeUndefined();
      expect(mediator_mock.send).toHaveBeenCalledTimes(1);
      expect(payment_gateway_mock.makeTransaction).toHaveBeenCalledTimes(1);
      expect(payment_repository_mock.createPayment).toHaveBeenCalledTimes(1);
      expect(payment_log_repository_mock.createPaymentLog).toHaveBeenCalledTimes(1);
    });
  });

  describe('PaymentService.processPayment', () => {

  });
});
