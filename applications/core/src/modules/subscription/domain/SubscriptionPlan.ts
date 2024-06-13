import Aggregate from "@share/Aggregate";
import Item, { ItemObject } from "./Item";

export enum RecurrenceTypes {
  MONTHLY = 'monthly',
  ANNUALLY = 'annually'
}

export type SubscriptionPlanObject = {
  id?: string;
  items: Array<ItemObject>;
  amount: number;
  recurrence_type: RecurrenceTypes;
  contract_url: string | undefined;
};

export default class SubscriptionPlan extends Aggregate<SubscriptionPlanObject> {
  #items: Array<Item> = [];
  #amount: number;
  #recurrence_type: RecurrenceTypes;
  #contract_url?: string;

  constructor(obj: SubscriptionPlanObject) {
    super(obj.id);
    this.#amount = obj.amount;
    this.#recurrence_type = obj.recurrence_type;
    this.#contract_url = obj.contract_url;
    for (let idx = 0; idx < obj.items.length; idx++) {
      this.#items.push(new Item(obj.items[idx]));
    }
  }

  toObject(): Required<SubscriptionPlanObject> {
    const items = [];
    for (let idx = 0; idx < this.#items.length; idx++) {
      items.push(this.#items[idx].toObject());
    }

    return {
      id: this.id,
      amount: this.#amount,
      recurrence_type: this.#recurrence_type,
      contract_url: this.#contract_url,
      items,
    };
  }
}