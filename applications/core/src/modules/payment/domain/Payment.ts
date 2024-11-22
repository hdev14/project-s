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
  tenant_id: string;
  customer: CustomerProps;
  reason?: string;
}>;

export default class Payment extends Aggregate<PaymentProps> implements AggregateRoot {
  #amount: number;
  #tax: number;
  #status: PaymentStatus;
  #subscription_id: string;
  #tenant_id: string;
  #customer: Customer;
  #reason?: string;

  constructor(props: PaymentProps) {
    super(props);
    this.#amount = props.amount;
    this.#tax = props.tax;
    this.#status = props.status;
    this.#subscription_id = props.subscription_id;
    this.#tenant_id = props.tenant_id;
    this.#customer = new Customer(props.customer);
    this.#reason = props.reason;
  }

  static fromObject(props: PaymentProps) {
    return new Payment(props);
  }

  cancel(reason: string) {
    this.#status = PaymentStatus.CANCELED;
    this.#reason = reason;
    this.update();
  }

  pay() {
    this.#status = PaymentStatus.PAID;
    this.update();
  }

  reject(reason: string) {
    this.#status = PaymentStatus.REJECTED;
    this.#reason = reason;
    this.update();
  }

  toObject(): RequiredProps<PaymentProps> {
    return {
      id: this.id,
      amount: this.#amount,
      tax: this.#tax,
      status: this.#status,
      subscription_id: this.#subscription_id,
      tenant_id: this.#tenant_id,
      customer: this.#customer.toObject(),
      reason: this.#reason,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
