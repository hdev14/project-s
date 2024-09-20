import Aggregate, { AggregateProps, RequiredProps } from "@shared/ddd/Aggregate";

export type ItemProps = AggregateProps<{
  name: string;
}>;

export default class Item extends Aggregate<ItemProps> {
  #name: string;

  constructor(props: ItemProps) {
    super(props);
    this.#name = props.name;
  }

  toObject(): RequiredProps<ItemProps> {
    return {
      id: this.id,
      name: this.#name,
      created_at: this.created_at,
      updated_at: this.updated_at
    }
  }
}
