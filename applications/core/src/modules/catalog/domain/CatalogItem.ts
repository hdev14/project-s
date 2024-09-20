import Aggregate, { AggregateProps, RequiredProps } from "@shared/ddd/Aggregate";
import DomainError from "@shared/errors/DomainError";
import Attribute, { AttributeValue } from "./Attribute";

export type CatalogItemProps = AggregateProps<{
  name: string;
  description: string;
  attributes: Array<AttributeValue>;
  is_service: boolean;
  tenant_id: string;
  amount: number;
  picture_url?: string;
}>;

export default class CatalogItem extends Aggregate<CatalogItemProps> {
  #name: string;
  #description: string;
  #attributes: Array<Attribute> = [];
  #is_service: boolean;
  #tenant_id: string;
  #amount: number = 0;
  #picture_url?: string;

  constructor(props: CatalogItemProps) {
    super(props);
    this.#name = props.name;
    this.#description = props.description;
    this.#is_service = props.is_service;
    this.#tenant_id = props.tenant_id;
    this.amount = props.amount;
    this.#picture_url = props.picture_url;

    for (let idx = 0; idx < props.attributes.length; idx++) {
      const attribute = props.attributes[idx];
      this.#attributes.push(new Attribute(attribute.name, attribute.description));
    }
  }

  set name(value: string) {
    this.#name = value;
  }

  set description(value: string) {
    this.#description = value;
  }

  set amount(value: number) {
    if (value <= 0) {
      throw new DomainError('catalog_item_negative_amount');
    }

    this.#amount = value;
  }

  set attributes(value: Array<AttributeValue>) {
    this.#attributes = [];

    for (let idx = 0; idx < value.length; idx++) {
      this.#attributes.push(new Attribute(value[idx].name, value[idx].description));
    }
  }

  set picture_url(value: string | undefined) {
    this.#picture_url = value;
  }

  toObject(): RequiredProps<CatalogItemProps> {
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
      amount: this.#amount,
      picture_url: this.#picture_url,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
