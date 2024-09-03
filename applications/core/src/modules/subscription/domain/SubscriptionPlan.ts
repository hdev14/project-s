import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";
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
  term_url?: string;
  tenant_id: string;
};

export default class SubscriptionPlan extends Aggregate<SubscriptionPlanObject> implements AggregateRoot {
  #items: Array<Item> = [];
  #amount: number;
  #recurrence_type: RecurrenceTypes;
  #term_url?: string;
  #tenant_id: string;

  constructor(obj: SubscriptionPlanObject) {
    super(obj.id);
    this.#amount = obj.amount;
    this.#recurrence_type = obj.recurrence_type;
    this.#term_url = obj.term_url;
    this.#tenant_id = obj.tenant_id;
    // TODO: must have an item
    for (let idx = 0; idx < obj.items.length; idx++) {
      this.#items.push(new Item(obj.items[idx]));
    }
  }

  // TODO
  // addCombo
  // withCombo

  toObject(): RequiredId<SubscriptionPlanObject> {
    const items = [];
    for (let idx = 0; idx < this.#items.length; idx++) {
      items.push(this.#items[idx].toObject());
    }

    return {
      id: this.id,
      amount: this.#amount,
      recurrence_type: this.#recurrence_type,
      term_url: this.#term_url,
      items,
      tenant_id: this.#tenant_id
    };
  }
}
