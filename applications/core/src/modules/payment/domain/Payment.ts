import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";
import Customer, { CustomerObject } from "./Customer";

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
}

export type PaymentObject = {
  id?: string;
  amount: number;
  tax: number;
  status: PaymentStatus;
  subscription_id: string;
  customer: CustomerObject;
}

export default class Payment extends Aggregate<PaymentObject> implements AggregateRoot {
  #amount: number;
  #tax: number;
  #status: PaymentStatus;
  #subcription_id: string;
  #customer: Customer;

  constructor(obj: PaymentObject) {
    super(obj.id);
    this.#amount = obj.amount;
    this.#tax = obj.tax;
    this.#status = obj.status;
    this.#subcription_id = obj.subscription_id;
    this.#customer = new Customer(obj.customer);
  }

  cancel() { }

  pay() { }

  reject() { }

  toObject(): RequiredId<PaymentObject> {
    return {
      id: this.id,
      amount: this.#amount,
      tax: this.#tax,
      status: this.#status,
      subscription_id: this.#subcription_id,
      customer: this.#customer.toObject(),
    }
  }
}
