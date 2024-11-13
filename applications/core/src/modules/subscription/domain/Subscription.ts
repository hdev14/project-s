import Aggregate, { AggregateProps, AggregateRoot, RequiredProps } from "@shared/ddd/Aggregate";
import DomainError from "@shared/errors/DomainError";

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELED = 'canceled',
  FINISHED = 'finished'
}

export type SubscriptionProps = AggregateProps<{
  subscriber_id: string;
  subscription_plan_id: string;
  started_at?: Date;
  billing_day: number;
  status: SubscriptionStatus;
  tenant_id: string;
}>;

export default class Subscription extends Aggregate<SubscriptionProps> implements AggregateRoot {
  #subscriber_id: string;
  #subscription_plan_id: string;
  #started_at?: Date;
  #billing_day: number;
  #status: SubscriptionStatus;
  #tenant_id: string;

  constructor(props: SubscriptionProps) {
    super(props);
    this.#subscriber_id = props.subscriber_id;
    this.#subscription_plan_id = props.subscription_plan_id;
    this.#started_at = props.started_at;
    this.#status = props.status;
    this.#tenant_id = props.tenant_id;
    if (props.billing_day < 0 || props.billing_day > 31) {
      throw new DomainError('subscription.billing_day');
    }
    this.#billing_day = props.billing_day;
  }

  static createPending(params: Pick<SubscriptionProps, 'subscriber_id' | 'subscription_plan_id' | 'tenant_id' | 'billing_day'>): Subscription {
    return new Subscription({
      subscriber_id: params.subscriber_id,
      subscription_plan_id: params.subscription_plan_id,
      tenant_id: params.tenant_id,
      status: SubscriptionStatus.PENDING,
      billing_day: params.billing_day,
    });
  }

  static fromObject(props: SubscriptionProps) {
    return new Subscription(props);
  }

  active() {
    if (this.#status === SubscriptionStatus.ACTIVE) {
      throw new DomainError('subscription_actived');
    }

    if (this.#status === SubscriptionStatus.CANCELED) {
      throw new DomainError('subscription_canceled');
    }

    if (this.#status === SubscriptionStatus.FINISHED) {
      throw new DomainError('subscription_finished');
    }

    this.#status = SubscriptionStatus.ACTIVE;
    this.#started_at = new Date();
    this.update();
  }

  pause() {
    if (this.#status === SubscriptionStatus.PENDING) {
      throw new DomainError('subscription_pending');
    }

    if (this.#status === SubscriptionStatus.CANCELED) {
      throw new DomainError('subscription_canceled');
    }

    if (this.#status === SubscriptionStatus.FINISHED) {
      throw new DomainError('subscription_finished');
    }

    if (this.#status === SubscriptionStatus.PAUSED) {
      throw new DomainError('subscription_paused');
    }

    this.#status = SubscriptionStatus.PAUSED;
    this.update();
  }

  cancel() {
    if (this.#status === SubscriptionStatus.CANCELED) {
      throw new DomainError('subscription_canceled');
    }

    if (this.#status === SubscriptionStatus.FINISHED) {
      throw new DomainError('subscription_finished');
    }

    this.#status = SubscriptionStatus.CANCELED;
    this.update();
  }

  toObject(): RequiredProps<SubscriptionProps> {
    return {
      id: this.id,
      subscriber_id: this.#subscriber_id,
      subscription_plan_id: this.#subscription_plan_id,
      started_at: this.#started_at,
      billing_day: this.#billing_day,
      status: this.#status,
      tenant_id: this.#tenant_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
    }
  }
}
