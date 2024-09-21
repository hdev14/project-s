import Aggregate, { AggregateProps, RequiredProps } from "@shared/ddd/Aggregate";

export type SubscriptionProps = AggregateProps<{
  id?: string;
  started_at: Date;
}>;

export default class Subscription extends Aggregate<SubscriptionProps> {
  #started_at: Date;

  constructor(props: SubscriptionProps) {
    super(props);
    this.#started_at = props.started_at;
  }

  static fromObject(props: SubscriptionProps) {
    return new Subscription(props);
  }

  toObject(): RequiredProps<SubscriptionProps> {
    return {
      id: this.id,
      started_at: this.#started_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
