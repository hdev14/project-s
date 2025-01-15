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
  next_billing_date?: Date;
}>;

export default class SubscriptionPlan extends Aggregate<SubscriptionPlanProps> implements AggregateRoot {
  #items: Array<Item> = [];
  #amount: number;
  #recurrence_type: RecurrenceTypes;
  #term_url?: string;
  #tenant_id: string;
  #next_billing_date?: Date;

  constructor(props: SubscriptionPlanProps) {
    super(props);
    this.#amount = props.amount;
    this.#recurrence_type = props.recurrence_type;
    this.#term_url = props.term_url;
    this.#tenant_id = props.tenant_id;
    this.items = props.items;
    this.#next_billing_date = props.next_billing_date;
  }

  set items(values: Array<ItemProps>) {
    const new_items = [];
    for (let idx = 0; idx < values.length; idx++) {
      new_items.push(new Item(values[idx]));
    }

    this.#items = new_items;
  }

  get items() {
    const result = [];
    for (let idx = 0; idx < this.#items.length; idx++) {
      result.push(this.#items[idx].toObject());
    }
    return result;
  }

  updateNextBillingDate() {
    const new_billing_date = new Date(this.#next_billing_date!);

    if (this.#recurrence_type === RecurrenceTypes.ANNUALLY) {
      new_billing_date.setMonth(new_billing_date.getMonth() + 12);
    } else {
      new_billing_date.setMonth(new_billing_date.getMonth() + 1);
    }

    this.#next_billing_date = new_billing_date;
    this.update();
  }

  static fromObject(props: SubscriptionPlanProps) {
    return new SubscriptionPlan(props);
  }

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
      next_billing_date: this.#next_billing_date,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
