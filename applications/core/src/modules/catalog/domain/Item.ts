import Aggregate, { RequiredId } from "@share/Aggregate";

export type ItemObject = {
  id?: string;
  name: string;
  description: string;
  is_service: boolean;
};

export default class Item extends Aggregate<ItemObject> {
  #name: string;
  #description: string;
  #is_service: boolean;

  constructor(obj: ItemObject) {
    super(obj.id);
    this.#name = obj.name;
    this.#description = obj.description;
    this.#is_service = obj.is_service;
  }

  toObject(): RequiredId<ItemObject> {
    return {
      id: this.id,
      name: this.#name,
      description: this.#description,
      is_service: this.#is_service,
    };
  }
}