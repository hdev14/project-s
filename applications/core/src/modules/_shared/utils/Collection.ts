import Aggregate from "@shared/ddd/Aggregate";

export default class Collection<T extends Aggregate<any>> extends Array<T> {
  constructor(items: Array<T>) {
    super(...items);
    Object.seal(this);
  }

  toObjectList<O = unknown>(): Array<O> {
    const objs = [];

    for (let idx = 0; idx < this.length; idx++) {
      objs.push(this[idx].toObject());
    }

    return objs;
  }
}