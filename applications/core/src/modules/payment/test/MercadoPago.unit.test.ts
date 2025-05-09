import { faker } from '@faker-js/faker/locale/pt_BR';
import PaymentGateway from '@payment/app/PaymentGateway';
import Payment, { PaymentStatus } from '@payment/domain/Payment';
import PaymentLog from '@payment/domain/PaymentLog';
import MercadoPago from "@payment/infra/external/MercadoPago";
import PaymentError from '@shared/errors/PaymentError';
import { mock } from 'jest-mock-extended';
import mercado_pago_fixtures from './fixtures/mercado_pago.json';

const fetch_spy = jest.spyOn(global, 'fetch');

describe('MercadoPago unit tests', () => {
  const OLD_ENV = process.env;
  const mercado_pago_base_url = 'https://api.mercadopago.com';
  let mercado_pago: PaymentGateway;

  beforeAll(() => {
    process.env = Object.assign({}, OLD_ENV, {
      MERCADO_PAGO_BASE_URL: mercado_pago_base_url,
      MERCADO_PAGO_CLIENT_ID: 'client_id_test',
      WEBHOOK_PAYMENT_BASE_URL: 'http://test.com/webhooks'
    });

    mercado_pago = new MercadoPago();

    const auth_response_mock = mock<Response>({
      status: 200,
      json: jest.fn(() => Promise.resolve(mercado_pago_fixtures.auth_response))
    });

    fetch_spy.mockResolvedValueOnce(auth_response_mock)
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('MercadoPago.registerCustomer', () => {
    it('should call the correct endpoint to create a customer', async () => {
      const customer_response_mock = mock<Response>({
        status: 200,
        json: jest.fn(() => Promise.resolve(mercado_pago_fixtures.create_customer_response))
      });

      fetch_spy.mockResolvedValueOnce(customer_response_mock);

      const customer = {
        document: faker.string.numeric(11),
        email: faker.internet.email(),
      };

      const result = await mercado_pago.registerCustomer(customer);

      expect(fetch_spy).toHaveBeenLastCalledWith(`${mercado_pago_base_url}/v1/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mercado_pago_fixtures.auth_response.access_token}`
        },
        body: JSON.stringify({
          email: customer.email,
          identification: {
            type: 'CPF',
            number: customer.document,
          }
        })
      });
      expect(result.document).toEqual(customer.document);
      expect(result.email).toEqual(customer.email);
      expect(result.id).toEqual(mercado_pago_fixtures.create_customer_response.id);
    });

    it('throws a PaymentError if the endpoint response with 400 status code', async () => {
      expect.assertions(2);

      const customer_response_mock = mock<Response>({
        status: 400,
        json: jest.fn(() => Promise.resolve(mercado_pago_fixtures.bad_request_response))
      });

      fetch_spy.mockResolvedValueOnce(customer_response_mock);

      try {
        await mercado_pago.registerCustomer({
          document: faker.string.numeric(11),
          email: faker.internet.email(),
        });
      } catch (e: any) {
        expect(e).toBeInstanceOf(PaymentError);
        expect(e.payload).toEqual(mercado_pago_fixtures.bad_request_response);
      }
    });
  });

  describe('MercadoPago.registerCreditCard', () => {
    it("should call the correct endpoint to save the customer's credit card", async () => {
      const credit_card_response_mock = mock<Response>({
        status: 200,
        json: jest.fn(() => Promise.resolve(mercado_pago_fixtures.save_credit_card_response))
      });

      fetch_spy.mockResolvedValueOnce(credit_card_response_mock);

      const customer_id = faker.string.uuid();
      const credit_card_token = faker.string.alphanumeric({ length: 32 });

      const result = await mercado_pago.registerCreditCard(customer_id, credit_card_token);

      expect(fetch_spy).toHaveBeenLastCalledWith(
        `${mercado_pago_base_url}/v1/customers/${customer_id}/cards`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mercado_pago_fixtures.auth_response.access_token}`
          },
          body: JSON.stringify({ token: credit_card_token })
        }
      );
      expect(result.credit_card_id).toEqual(mercado_pago_fixtures.save_credit_card_response.id);
    });

    it('throws a PaymentError if the endpoint response with 400 status code', async () => {
      expect.assertions(2);

      const credit_card_response_mock = mock<Response>({
        status: 400,
        json: jest.fn(() => Promise.resolve(mercado_pago_fixtures.bad_request_response))
      });

      fetch_spy.mockResolvedValueOnce(credit_card_response_mock);

      try {
        await mercado_pago.registerCreditCard(faker.string.uuid(), faker.string.alphanumeric({ length: 32 }));
      } catch (e: any) {
        expect(e).toBeInstanceOf(PaymentError);
        expect(e.payload).toEqual(mercado_pago_fixtures.bad_request_response);
      }
    });
  });

  describe('MercadoPago.makePayment', () => {
    it("should call the correct endpoint to create new payment", async () => {
      const payment_response_mock = mock<Response>({
        status: 200,
        json: jest.fn(() => Promise.resolve(mercado_pago_fixtures.payment_response))
      });

      fetch_spy.mockResolvedValueOnce(payment_response_mock);

      const payment = new Payment({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        status: faker.helpers.enumValue(PaymentStatus),
        subscription_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
        tax: faker.number.float(),
        customer: {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          credit_card_external_id: faker.string.uuid(),
          documnt: faker.string.numeric(11),
        }
      });

      const payment_log = await mercado_pago.makePayment(payment);

      const payment_obj = payment.toObject();

      expect(payment_log).toBeInstanceOf(PaymentLog);
      expect(payment_log.toObject().external_id).toEqual(mercado_pago_fixtures.payment_response.id);
      expect(payment_log.toObject().payment_id).toEqual(payment_obj.id);
      expect(payment_log.toObject().payload).toEqual(JSON.stringify(mercado_pago_fixtures.payment_response));
      expect(fetch_spy).toHaveBeenLastCalledWith(
        `${mercado_pago_base_url}/v1/payments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mercado_pago_fixtures.auth_response.access_token}`,
            'X-Idempotency-Key': payment.id,
          },
          body: JSON.stringify({
            external_reference: payment.id,
            transaction_amount: payment_obj.amount,
            statement_descriptor: 'PROJECT_S',
            description: "Pagamento de assinatura",
            installments: 1,
            token: payment_obj.customer.credit_card_external_id,
            metadata: payment_obj,
            callback_url: `http://test.com/webhooks/mp/${payment_obj.id}`,
            binary_mode: true,
            payer: {
              email: payment_obj.customer.email,
              identification: {
                type: 'CPF',
                number: payment_obj.customer.documnt,
              }
            }
          })
        }
      );
    });

    it('throws a PaymentError if the endpoint response with 400 status code', async () => {
      expect.assertions(2);

      const payment_response_mock = mock<Response>({
        status: 400,
        json: jest.fn(() => Promise.resolve(mercado_pago_fixtures.bad_request_response))
      });

      fetch_spy.mockResolvedValueOnce(payment_response_mock);

      try {
        await mercado_pago.makePayment(
          new Payment({
            id: faker.string.uuid(),
            amount: faker.number.float(),
            status: faker.helpers.enumValue(PaymentStatus),
            subscription_id: faker.string.uuid(),
            tenant_id: faker.string.uuid(),
            tax: faker.number.float(),
            customer: {
              id: faker.string.uuid(),
              email: faker.internet.email(),
              credit_card_external_id: faker.string.uuid(),
              documnt: faker.string.numeric(11),
            }
          })
        );
      } catch (e: any) {
        expect(e).toBeInstanceOf(PaymentError);
        expect(e.payload).toEqual(mercado_pago_fixtures.bad_request_response);
      }
    });
  });

  describe('MercadoPago.getPayment', () => {
    it('should return NULL if mercado pago returns 404', async () => {
      const payment_response_mock = mock<Response>({
        status: 404,
        json: jest.fn(() => Promise.resolve({}))
      });

      fetch_spy.mockResolvedValueOnce(payment_response_mock);

      const external_id = faker.string.uuid();
      const transaction = await mercado_pago.getPayment(external_id);

      expect(transaction).toBeNull();
      expect(fetch_spy).toHaveBeenLastCalledWith(
        `${mercado_pago_base_url}/v1/payments/${external_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mercado_pago_fixtures.auth_response.access_token}`
          },
        }
      );
    });

    it('returns the transaction information after retrieve the data', async () => {
      const payment_response_mock = mock<Response>({
        status: 200,
        json: jest.fn(() => Promise.resolve(mercado_pago_fixtures.payment_response))
      });

      fetch_spy.mockResolvedValueOnce(payment_response_mock);

      const external_id = faker.string.uuid();
      const transaction = await mercado_pago.getPayment(external_id);

      expect(transaction).toEqual({
        payment_id: mercado_pago_fixtures.payment_response.external_reference,
        status: PaymentStatus.PAID,
        reason: expect.any(String),
        payload: JSON.stringify(mercado_pago_fixtures.payment_response),
      });
      expect(fetch_spy).toHaveBeenLastCalledWith(
        `${mercado_pago_base_url}/v1/payments/${external_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mercado_pago_fixtures.auth_response.access_token}`
          },
        }
      );
    });

    it('throws a PaymentError if something goes wrong', async () => {
      expect.assertions(2);

      const payment_response_mock = mock<Response>({
        status: 400,
        json: jest.fn(() => Promise.resolve(mercado_pago_fixtures.bad_request_response))
      });

      fetch_spy.mockResolvedValueOnce(payment_response_mock);

      try {
        await mercado_pago.getPayment(faker.string.uuid());
      } catch (e: any) {
        expect(e).toBeInstanceOf(PaymentError);
        expect(e.payload).toEqual(mercado_pago_fixtures.bad_request_response);
      }
    });
  });
});
