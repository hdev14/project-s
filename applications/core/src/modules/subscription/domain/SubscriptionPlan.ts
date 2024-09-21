import Aggregate, { AggregateProps, AggregateRoot, RequiredProps } from "@shared/ddd/Aggregate";
import Item, { ItemProps } from "./Item";

export enum RecurrenceTypes {
  MONTHLY = 'monthly',
  ANNUALLY = 'annually'
}

export type SubscriptionPlanProps = AggregateProps<{
  items: Array<ItemProps>;
  amount: number;
  recurrence_type: RecurrenceTypes;
  term_url?: string;
  tenant_id: string;
}>;

export default class SubscriptionPlan extends Aggregate<SubscriptionPlanProps> implements AggregateRoot {
  #items: Array<Item> = [];
  #amount: number;
  #recurrence_type: RecurrenceTypes;
  #term_url?: string;
  #tenant_id: string;

  constructor(props: SubscriptionPlanProps) {
    super(props);
    this.#amount = props.amount;
    this.#recurrence_type = props.recurrence_type;
    this.#term_url = props.term_url;
    this.#tenant_id = props.tenant_id;
    // TODO: must have an item
    for (let idx = 0; idx < props.items.length; idx++) {
      this.#items.push(new Item(props.items[idx]));
    }
  }

  static fromObject(props: SubscriptionPlanProps) {
    return new SubscriptionPlan(props);
  }

  // TODO
  // addCombo
  // withCombo

  toObject(): RequiredProps<SubscriptionPlanProps> {
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
      tenant_id: this.#tenant_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
