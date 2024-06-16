import Aggregate, { RequiredId } from "@shared/ddd/Aggregate";
import Attribute, { AttributeValue } from "./Attribute";

export type CatalogItemObject = {
  id?: string;
  name: string;
  description: string;
  attributes: Array<AttributeValue>;
  is_service: boolean;
};

export default class CatalogItem extends Aggregate<CatalogItemObject> {
  #name: string;
  #description: string;
  #attributes: Array<Attribute> = [];
  #is_service: boolean;

  constructor(obj: CatalogItemObject) {
    super(obj.id);
    this.#name = obj.name;
    this.#description = obj.description;
    this.#is_service = obj.is_service;

    for (let idx = 0; idx < obj.attributes.length; idx++) {
      const attribute = obj.attributes[idx];
      this.#attributes.push(new Attribute(attribute.att_name, attribute.att_value));
    }
  }

  toObject(): RequiredId<CatalogItemObject> {
    const attributes = [];

    for (let idx = 0; idx < this.#attributes.length; idx++) {
      attributes.push(this.#attributes[idx].value);
    }

    return {
      id: this.id,
      name: this.#name,
      description: this.#description,
      is_service: this.#is_service,
      attributes,
    };
  }
}