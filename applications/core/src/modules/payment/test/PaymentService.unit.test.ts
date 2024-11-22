import { faker } from "@faker-js/faker";
import PaymentLogRepository from "@payment/app/PaymentLogRepository";
import PaymentRepository from "@payment/app/PaymentRepository";
import PaymentService from "@payment/app/PaymentService";
import { PaymentStatus } from "@payment/domain/Payment";
import { mock } from "jest-mock-extended";

describe('PaymentService unit tests', () => {
  const payment_repository_mock = mock<PaymentRepository>();
  const payment_log_repository_mock = mock<PaymentLogRepository>();
  const payment_service = new PaymentService(
    payment_repository_mock,
    payment_log_repository_mock
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
    })
  });

  describe('PaymentService.getPaymentLogs', () => {

  });

  describe('PaymentService.createPayment', () => {

  });

  describe('PaymentService.processPayment', () => {

  });
});
