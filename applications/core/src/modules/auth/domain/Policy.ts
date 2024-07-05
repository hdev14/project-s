import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";

export type PolicyObject = {
  id?: string
  slug: string;
  description?: string;
  is_secret?: boolean;
}

export default class Policy extends Aggregate<PolicyObject> implements AggregateRoot {
  #slug: string;
  #description?: string;
  #is_secret?: boolean;

  constructor(obj: PolicyObject) {
    super(obj.id);
    this.#slug = obj.slug.toLocaleLowerCase().replace(/\s/g, '_');
    this.#description = obj.description;
    this.#is_secret = obj.is_secret;
  }

  toObject(): RequiredId<PolicyObject> {
    return {
      id: this.id,
      slug: this.#slug,
      description: this.#description,
      is_secret: this.#is_secret,
    }
  }
}