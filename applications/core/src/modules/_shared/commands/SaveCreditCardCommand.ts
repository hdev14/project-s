import { AddressValue } from "@shared/Address";
import Command from "@shared/Command";

type SaveCreditCardCommandParams = {
  customer_id: string;
  email: string;
  document: string;
  address: AddressValue;
  credit_card_token: string;
};

export default class SaveCreditCardCommand extends Command {
  readonly customer_id: string;
  readonly email: string;
  readonly document: string;
  readonly address: AddressValue;
  readonly credit_card_token: string;

  constructor(params: SaveCreditCardCommandParams) {
    super();
    this.email = params.email;
    this.customer_id = params.customer_id;
    this.document = params.document;
    this.address = params.address;
    this.credit_card_token = params.credit_card_token;
  }
}
