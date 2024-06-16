import Aggregate, { RequiredId } from "@shared/ddd/Aggregate";

export type SubscriptionObject = {
  id?: string;
  amount: number;
  recurrence_type: string;
  started_at: Date;
};

export default class Subscription extends Aggregate<SubscriptionObject> {
  #amount: number;
  #started_at: Date;
  #recurrence_type: string;

  constructor(obj: SubscriptionObject) {
    super(obj.id);
    this.#amount = obj.amount;
    this.#started_at = obj.started_at;
    this.#recurrence_type = obj.recurrence_type;
  }

  toObject(): RequiredId<SubscriptionObject> {
    return {
      id: this.id,
      amount: this.#amount,
      started_at: this.#started_at,
      recurrence_type: this.#recurrence_type,
    };
  }
}