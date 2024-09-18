import Aggregate, { RequiredId } from "@shared/ddd/Aggregate";

export type SubscriptionObject = {
  id?: string;
  started_at: Date;
};

export default class Subscription extends Aggregate<SubscriptionObject> {
  #started_at: Date;

  constructor(obj: SubscriptionObject) {
    super(obj.id);
    this.#started_at = obj.started_at;
  }

  toObject(): RequiredId<SubscriptionObject> {
    return {
      id: this.id,
      started_at: this.#started_at,
    };
  }
}
