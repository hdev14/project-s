import Aggregate, { RequiredId } from "@shared/ddd/Aggregate";
import Attribute, { AttributeValue } from "./Attribute";

export type CatalogItemObject = {
  id?: string;
  name: string;
  description: string;
  attributes: Array<AttributeValue>;
  is_service: boolean;
  tenant_id: string;
  picture_url?: string;
};

export default class CatalogItem extends Aggregate<CatalogItemObject> {
  #name: string;
  #description: string;
  #attributes: Array<Attribute> = [];
  #is_service: boolean;
  #tenant_id: string;
  #picture_url?: string;

  constructor(obj: CatalogItemObject) {
    super(obj.id);
    this.#name = obj.name;
    this.#description = obj.description;
    this.#is_service = obj.is_service;
    this.#tenant_id = obj.tenant_id;
    this.#picture_url = obj.picture_url;

    for (let idx = 0; idx < obj.attributes.length; idx++) {
      const attribute = obj.attributes[idx];
      this.#attributes.push(new Attribute(attribute.name, attribute.description));
    }
  }

  set name(value: string) {
    this.#name = value;
  }

  set description(value: string) {
    this.#description = value;
  }

  set attributes(value: Array<Attribute>) {
    this.#attributes = value;
  }

  set picture_url(value: string) {
    this.#picture_url = value;
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
      attributes,
      is_service: this.#is_service,
      tenant_id: this.#tenant_id,
      picture_url: this.#picture_url,
    };
  }
}