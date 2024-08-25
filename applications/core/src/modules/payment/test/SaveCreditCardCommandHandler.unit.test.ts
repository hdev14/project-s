import { faker } from '@faker-js/faker/locale/pt_BR';
import PaymentGateway from "@payment/app/PaymentGateway";
import SaveCreditCardCommandHandler from "@payment/app/SaveCreditCardCommandHandler";
import SaveCreditCardCommand from "@shared/commands/SaveCreditCardCommand";
import { mock } from "jest-mock-extended";

describe('SaveCreditCardCommandHandler unit tests', () => {
  const payment_gateway_mock = mock<PaymentGateway>();
  const handler = new SaveCreditCardCommandHandler(payment_gateway_mock);

  it('should register a new external customer and a new credit card', async () => {
    const command = new SaveCreditCardCommand({
      customer_id: faker.string.uuid(),
      document: faker.string.numeric(11),
      email: faker.internet.email(),
      credit_card_token: faker.string.alphanumeric({ length: 32 }),
    });

    const customer_id = faker.string.uuid();

    payment_gateway_mock.registerCustomer.mockResolvedValueOnce({
      document: faker.string.numeric(11),
      email: faker.internet.email(),
      id: customer_id,
    });

    const credit_card_id = faker.string.uuid();

    payment_gateway_mock.registerCreditCard.mockResolvedValueOnce({
      credit_card_id,
    });

    const result = await handler.handle(command);

    expect(payment_gateway_mock.registerCustomer).toHaveBeenCalledWith({
      email: command.email,
      document: command.document,
    })
    expect(payment_gateway_mock.registerCreditCard).toHaveBeenCalledWith(
      customer_id,
      command.credit_card_token
    );
    expect(result).toEqual(credit_card_id);
  });
});
