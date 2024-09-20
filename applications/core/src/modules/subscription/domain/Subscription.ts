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
  status: SubscriptionStatus;
  tenant_id: string;
}>;

export default class Subscription extends Aggregate<SubscriptionProps> implements AggregateRoot {
  #subscriber_id: string;
  #subscription_plan_id: string;
  #started_at?: Date;
  #status: SubscriptionStatus;
  #tenant_id: string;

  constructor(props: SubscriptionProps) {
    super(props);
    this.#subscriber_id = props.subscriber_id;
    this.#subscription_plan_id = props.subscription_plan_id;
    this.#started_at = props.started_at;
    this.#status = props.status;
    this.#tenant_id = props.tenant_id;
  }

  static createPending(params: Pick<SubscriptionProps, 'subscriber_id' | 'subscription_plan_id' | 'tenant_id'>): Subscription {
    return new Subscription({
      subscriber_id: params.subscriber_id,
      subscription_plan_id: params.subscription_plan_id,
      tenant_id: params.tenant_id,
      status: SubscriptionStatus.PENDING,
    });
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
  }

  cancel() {
    if (this.#status === SubscriptionStatus.CANCELED) {
      throw new DomainError('subscription_canceled');
    }

    if (this.#status === SubscriptionStatus.FINISHED) {
      throw new DomainError('subscription_finished');
    }

    this.#status = SubscriptionStatus.CANCELED;
  }

  toObject(): RequiredProps<SubscriptionProps> {
    return {
      id: this.id,
      subscriber_id: this.#subscriber_id,
      subscription_plan_id: this.#subscription_plan_id,
      started_at: this.#started_at,
      status: this.#status,
      tenant_id: this.#tenant_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
    }
  }
}
