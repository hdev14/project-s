import Aggregate from "@share/Aggregate";

export type PaymentLogObject = {
  id?: string;
  external_id: string;
  payload: string;
}

export default class PaymentLog extends Aggregate<PaymentLogObject> {
  #external_id: string;
  #payload: string;

  constructor(obj: PaymentLogObject) {
    super(obj.id);
    this.#external_id = obj.external_id;
    this.#payload = obj.payload;
  }

  toObject(): Required<PaymentLogObject> {
    return {
      id: this.id,
      external_id: this.#external_id,
      payload: this.#payload
    }
  }
}