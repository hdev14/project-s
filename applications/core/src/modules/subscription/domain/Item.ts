import Aggregate, { RequiredId } from "@shared/ddd/Aggregate";

export type ItemObject = {
  id?: string;
  name: string;
}

export default class Item extends Aggregate<ItemObject> {
  #name: string;

  constructor(obj: ItemObject) {
    super(obj.id);
    this.#name = obj.name;
  }

  toObject(): RequiredId<ItemObject> {
    return {
      id: this.id,
      name: this.#name,
    }
  }
}