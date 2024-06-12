import Aggregate from "@share/Aggregate";

export type SubscriptionItemObject = {
  id?: string;
  name: string;
}

export default class SubscriptionItem extends Aggregate<SubscriptionItemObject> {
  #name: string;

  constructor(obj: SubscriptionItemObject) {
    super(obj.id);
    this.#name = obj.name;
  }

  toObject(): Required<SubscriptionItemObject> {
    return {
      id: this.id,
      name: this.#name,
    }
  }
}