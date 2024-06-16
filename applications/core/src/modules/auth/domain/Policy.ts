import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";

export type PolicyObject = {
  id?: string
  slug: string;
  description: string | undefined;
}

export default class Policy extends Aggregate<PolicyObject> implements AggregateRoot {
  #slug: string;
  #description?: string;

  constructor(obj: PolicyObject) {
    super(obj.id);
    this.#slug = obj.slug;
    this.#description = obj.description;
  }

  toObject(): RequiredId<PolicyObject> {
    return {
      id: this.id,
      slug: this.#slug,
      description: this.#description,
    }
  }
}