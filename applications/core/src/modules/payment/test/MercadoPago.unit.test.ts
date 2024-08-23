import { faker } from '@faker-js/faker/locale/pt_BR';
import PaymentGateway from '@payment/app/PaymentGateway';
import MercadoPago from "@payment/infra/MercadoPago";
import { mock } from 'jest-mock-extended';
import mercado_pago_fixtures from './fixtures/mercado_pago.json';

const fetch_spy = jest.spyOn(global, 'fetch');



describe('MercadoPago unit tests', () => {
  const OLD_ENV = process.env;
  const mercado_pago_base_url = 'https://api.mercadopago.com';
  let mercado_pago: PaymentGateway;

  beforeAll(() => {
    process.env = Object.assign({}, OLD_ENV, {
      MP_BASE_URL: mercado_pago_base_url,
      MP_CLIENT_ID: 'client_id_test',
    });
    mercado_pago = new MercadoPago();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('MercadoPago.registerCustomer', () => {
    it('should call the correct endpoint to create a customer', async () => {
      const auth_response_mock = mock<Response>({
        status: 200,
        json: jest.fn(() => Promise.resolve(mercado_pago_fixtures.auth_response))
      });

      const customer_response_mock = mock<Response>({
        status: 200,
        json: jest.fn(() => Promise.resolve(mercado_pago_fixtures.create_customer_response_200))
      });

      fetch_spy
        .mockResolvedValueOnce(auth_response_mock)
        .mockResolvedValueOnce(customer_response_mock);

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
      expect(result.id).toEqual(mercado_pago_fixtures.create_customer_response_200.id);
    });
  });
});
