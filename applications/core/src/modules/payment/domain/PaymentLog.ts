import Aggregate, { RequiredId } from "@shared/ddd/Aggregate";

export type PaymentLogObject = {
  id?: string;
  external_id: string;
  payload: string; // JSON
}

export default class PaymentLog extends Aggregate<PaymentLogObject> {
  #external_id: string;
  #payload: string;

  constructor(obj: PaymentLogObject) {
    super(obj.id);
    this.#external_id = obj.external_id;
    this.#payload = obj.payload;
  }

  toObject(): RequiredId<PaymentLogObject> {
    return {
      id: this.id,
      external_id: this.#external_id,
      payload: this.#payload
    }
  }
}
