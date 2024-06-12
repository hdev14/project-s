import Aggregate from "@share/Aggregate";
import SubscriptionItem, { SubscriptionItemObject } from "./SubscriptionItem";

export type SubscriptionObject = {
  id?: string;
  amount: number;
  items: Array<SubscriptionItemObject>;
  started_at: Date;
};

export default class Subscription extends Aggregate<SubscriptionObject> {
  #amount: number;
  #items: Array<SubscriptionItem> = [];
  #started_at: Date;

  constructor(obj: SubscriptionObject) {
    super(obj.id);
    this.#amount = obj.amount;
    this.#started_at = obj.started_at;
    for (let idx = 0; idx < obj.items.length; idx++) {
      this.#items.push(new SubscriptionItem(obj.items[idx]));
    }
  }

  toObject(): Required<SubscriptionObject> {
    const items = [];

    for (let idx = 0; idx < this.#items.length; idx++) {
      items.push(this.#items[idx].toObject());
    }

    return {
      id: this.id,
      amount: this.#amount,
      started_at: this.#started_at,
      items,
    }
  }
}