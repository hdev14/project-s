import Aggregate, { AggregateProps, AggregateRoot, RequiredProps } from "@shared/ddd/Aggregate";

export type PaymentLogProps = AggregateProps<{
  id?: string;
  external_id: string;
  payment_id: string;
  payload: string; // JSON
}>;

export default class PaymentLog extends Aggregate<PaymentLogProps> implements AggregateRoot {
  #external_id: string;
  #payment_id: string;
  #payload: string;

  constructor(props: PaymentLogProps) {
    super(props);
    this.#external_id = props.external_id;
    this.#payment_id = props.payment_id;
    this.#payload = props.payload;
  }

  static fromObject(props: PaymentLogProps) {
    return new PaymentLog(props);
  }

  toObject(): RequiredProps<PaymentLogProps> {
    return {
      id: this.id,
      external_id: this.#external_id,
      payment_id: this.#payment_id,
      payload: this.#payload,
      created_at: this.created_at,
      updated_at: this.updated_at
    }
  }
}
