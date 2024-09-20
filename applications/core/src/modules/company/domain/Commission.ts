import Aggregate, { AggregateProps, AggregateRoot, RequiredProps } from "@shared/ddd/Aggregate";
import DomainError from "@shared/errors/DomainError";

export enum TaxTypes {
  PERCENTAGE = 'percentage',
  RAW = 'raw'
}

export type CommissionProps = AggregateProps & {
  catalog_item_id: string;
  tax: number;
  tax_type: TaxTypes;
  tenant_id: string;
};

export default class Commission extends Aggregate<CommissionProps> implements AggregateRoot {
  #catalog_item_id: string;
  #tax: number = 0;
  #tax_type: TaxTypes;
  #tenant_id: string;

  constructor(props: CommissionProps) {
    super(props);
    this.#catalog_item_id = props.catalog_item_id;
    this.#tax_type = props.tax_type;
    this.tax = props.tax;
    this.#tenant_id = props.tenant_id;
  }

  set tax_type(value: TaxTypes) {
    this.#tax_type = value;
  }

  set tax(value: number) {
    if (this.#tax_type === TaxTypes.PERCENTAGE && value > 1) {
      throw new DomainError('tax_percentage_error');
    }
    this.#tax = value;
  }

  calculate(paid_amount: number) {
    if (this.#tax_type === TaxTypes.PERCENTAGE) {
      return paid_amount * this.#tax;
    }

    return this.#tax;
  }

  toObject(): RequiredProps<CommissionProps> {
    return {
      id: this.id,
      catalog_item_id: this.#catalog_item_id,
      tax: this.#tax,
      tax_type: this.#tax_type,
      tenant_id: this.#tenant_id,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
