import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";
import DomainError from "@shared/errors/DomainError";

export enum TaxTypes {
  PERCENTAGE = 'percentage',
  RAW = 'raw'
}

export type CommissionObject = {
  id?: string;
  catalog_item_id: string;
  tax: number;
  tax_type: TaxTypes;
  tenant_id: string;
};

export default class Commission extends Aggregate<CommissionObject> implements AggregateRoot {
  #catalog_item_id: string;
  #tax: number = 0;
  #tax_type: TaxTypes;
  #tenant_id: string;

  constructor(obj: CommissionObject) {
    super(obj.id);
    this.#catalog_item_id = obj.catalog_item_id;
    this.#tax_type = obj.tax_type;
    this.tax = obj.tax;
    this.#tenant_id = obj.tenant_id;
  }

  set tax(value: number) {
    if (this.#tax_type === TaxTypes.PERCENTAGE && value > 1) {
      throw new DomainError(Commission.name, 'tax_percentage_error');
    }
    this.#tax = value;
  }

  calculate(paid_amount: number) {
    if (this.#tax_type === TaxTypes.PERCENTAGE) {
      return paid_amount * this.#tax;
    }

    return this.#tax;
  }

  toObject(): RequiredId<CommissionObject> {
    return {
      id: this.id,
      catalog_item_id: this.#catalog_item_id,
      tax: this.#tax,
      tax_type: this.#tax_type,
      tenant_id: this.#tenant_id,
    };
  }
}