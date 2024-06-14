import Aggregate, { AggregateRoot, RequiredId } from "@share/ddd/Aggregate";
import SubscriptionPlan, { SubscriptionPlanObject } from "./SubscriptionPlan";

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELED = 'canceled'
}

export type SubscriptionObject = {
  id?: string;
  subscriber_id: string;
  subscription_plan: SubscriptionPlanObject;
  started_at: Date;
  status: SubscriptionStatus;
}

export default class Subscription extends Aggregate<SubscriptionObject> implements AggregateRoot {
  #subscriber_id: string;
  #subscription_plan: SubscriptionPlan;
  #started_at: Date;
  #status: SubscriptionStatus;

  constructor(obj: SubscriptionObject) {
    super(obj.id);
    this.#subscriber_id = obj.subscriber_id;
    this.#subscription_plan = new SubscriptionPlan(obj.subscription_plan);
    this.#started_at = obj.started_at;
    this.#status = obj.status;
  }

  toObject(): RequiredId<SubscriptionObject> {
    return {
      id: this.id,
      subscriber_id: this.#subscriber_id,
      subscription_plan: this.#subscription_plan.toObject(),
      started_at: this.#started_at,
      status: this.#status,
    }
  }
}