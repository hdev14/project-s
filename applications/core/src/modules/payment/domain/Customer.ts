import Aggregate, { RequiredId } from "@shared/ddd/Aggregate";

export type CustomerObject = {
  id?: string;
  documnt: string;
  email: string;
  credit_card_external_id: string | undefined;
};

export default class Customer extends Aggregate<CustomerObject> {
  #document: string;
  #email: string;
  #credit_card_external_id?: string;

  constructor(obj: CustomerObject) {
    super(obj.id);
    this.#document = obj.documnt;
    this.#email = obj.email;
    this.#credit_card_external_id = obj.credit_card_external_id;
  }

  toObject(): RequiredId<CustomerObject> {
    return {
      id: this.id,
      documnt: this.#document,
      email: this.#email,
      credit_card_external_id: this.#credit_card_external_id
    }
  }
}
