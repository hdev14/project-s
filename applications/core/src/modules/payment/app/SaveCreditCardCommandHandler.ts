import Handler from "@shared/Handler";
import SaveCreditCardCommand from "@shared/commands/SaveCreditCardCommand";
import PaymentGateway from "./PaymentGateway";

export default class SaveCreditCardCommandHandler implements Handler<SaveCreditCardCommand, string> {
  #payment_gateway: PaymentGateway;

  constructor(payment_gateway: PaymentGateway) {
    this.#payment_gateway = payment_gateway;
  }

  async handle(command: SaveCreditCardCommand): Promise<string> {
    const customer = await this.#payment_gateway.registerCustomer({
      document: command.document,
      email: command.email,
    });

    const result = await this.#payment_gateway.registerCreditCard(
      customer.id,
      command.credit_card_token
    );

    return result.credit_card_id;
  }
}
