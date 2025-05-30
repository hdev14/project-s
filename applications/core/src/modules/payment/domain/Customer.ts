import Aggregate, { AggregateProps, RequiredProps } from "@shared/ddd/Aggregate";

export type CustomerProps = AggregateProps<{
  id?: string;
  documnt: string;
  email: string;
  credit_card_external_id?: string;
}>;

export default class Customer extends Aggregate<CustomerProps> {
  #document: string;
  #email: string;
  #credit_card_external_id?: string;

  constructor(props: CustomerProps) {
    super(props);
    this.#document = props.documnt;
    this.#email = props.email;
    this.#credit_card_external_id = props.credit_card_external_id;
  }

  static fromObject(props: CustomerProps) {
    return new Customer(props);
  }

  toObject(): RequiredProps<CustomerProps> {
    return {
      id: this.id,
      documnt: this.#document,
      email: this.#email,
      credit_card_external_id: this.#credit_card_external_id,
      created_at: this.created_at,
      updated_at: this.updated_at
    }
  }
}
