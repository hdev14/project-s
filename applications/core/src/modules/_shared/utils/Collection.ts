import Aggregate, { AggregateProps, RequiredProps } from "@shared/ddd/Aggregate";

export default class Collection<P extends AggregateProps> {
  readonly items: Array<Aggregate<P>>;

  constructor(items: Array<Aggregate<P>>) {
    this.items = items;
  }

  toArray(): Array<RequiredProps<P>> {
    const list = [];

    for (let idx = 0; idx < this.items.length; idx++) {
      list.push(this.items[idx].toObject());
    }

    return list;
  }
}
