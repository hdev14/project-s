import Aggregate from "@share/Aggregate";
import AggregateRoot from "@share/AggregateRoot";
import PaymentLog, { PaymentLogObject } from "./PaymentLog";

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export type PaymentObject = {
  id?: string;
  amount: number;
  tax: number;
  status: PaymentStatus;
  subscription_id: string;
  logs: Array<PaymentLogObject>;
}

export default class Payment extends Aggregate<PaymentObject> implements AggregateRoot {
  #amount: number;
  #tax: number;
  #status: PaymentStatus;
  #subcription_id: string;
  #logs: Array<PaymentLog> = [];

  constructor(obj: PaymentObject) {
    super(obj.id);
    this.#amount = obj.amount;
    this.#tax = obj.tax;
    this.#status = obj.status;
    this.#subcription_id = obj.subscription_id;
    for (let idx = 0; idx < obj.logs.length; idx++) {
      this.#logs.push(new PaymentLog(obj.logs[idx]));
    }
  }

  toObject(): Required<PaymentObject> {
    const logs = [];

    for (let idx = 0; idx < this.#logs.length; idx++) {
      logs.push(this.#logs[idx].toObject());
    }

    return {
      id: this.id,
      amount: this.#amount,
      tax: this.#tax,
      status: this.#status,
      subscription_id: this.#subcription_id,
      logs,
    }
  }
}
