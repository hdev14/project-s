import Aggregate, { AggregateProps, AggregateRoot, RequiredProps } from "@shared/ddd/Aggregate";

export type PolicyProps = AggregateProps<{
  slug: string;
  description?: string;
  is_secret?: boolean;
}>;

export default class Policy extends Aggregate<PolicyProps> implements AggregateRoot {
  #slug: string;
  #description?: string;
  #is_secret?: boolean;

  constructor(props: PolicyProps) {
    super(props);
    this.#slug = props.slug.toLocaleLowerCase().replace(/\s/g, '_');
    this.#description = props.description;
    this.#is_secret = props.is_secret;
  }

  static fromObject(props: PolicyProps) {
    return new Policy(props);
  }

  toObject(): RequiredProps<PolicyProps> {
    return {
      id: this.id,
      slug: this.#slug,
      description: this.#description,
      is_secret: this.#is_secret,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
