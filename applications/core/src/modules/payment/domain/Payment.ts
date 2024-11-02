import Aggregate, { AggregateProps, AggregateRoot, RequiredProps } from "@shared/ddd/Aggregate";
import Customer, { CustomerProps } from "./Customer";

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
}

export type PaymentProps = AggregateProps<{
  id?: string;
  amount: number;
  tax: number;
  status: PaymentStatus;
  subscription_id: string;
  customer: CustomerProps;
}>;

export default class Payment extends Aggregate<PaymentProps> implements AggregateRoot {
  #amount: number;
  #tax: number;
  #status: PaymentStatus;
  #subcription_id: string;
  #customer: Customer;

  constructor(props: PaymentProps) {
    super(props);
    this.#amount = props.amount;
    this.#tax = props.tax;
    this.#status = props.status;
    this.#subcription_id = props.subscription_id;
    this.#customer = new Customer(props.customer);
  }

  static fromObject(props: PaymentProps) {
    return new Payment(props);
  }

  cancel() {
    this.update();
  }

  pay() {
    this.update();
  }

  reject() {
    this.update();
  }

  toObject(): RequiredProps<PaymentProps> {
    return {
      id: this.id,
      amount: this.#amount,
      tax: this.#tax,
      status: this.#status,
      subscription_id: this.#subcription_id,
      customer: this.#customer.toObject(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
