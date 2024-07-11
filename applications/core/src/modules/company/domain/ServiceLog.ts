import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";
import Commission, { CommissionObject } from "./Commission";

export type ServiceLogObject = {
  id?: string;
  commission: CommissionObject;
  customer_id: string;
  tenant_id: string;
  paid_amount: number;
  registed_at: Date;
};

export default class ServiceLog extends Aggregate<ServiceLogObject> implements AggregateRoot {
  #commission: Commission;
  #customer_id: string;
  #tenant_id: string;
  #paid_amount: number;
  #registed_at: Date;

  constructor(obj: ServiceLogObject) {
    super(obj.id);
    this.#commission = new Commission(obj.commission);
    this.#customer_id = obj.customer_id;
    this.#tenant_id = obj.tenant_id;
    this.#paid_amount = obj.paid_amount;
    this.#registed_at = obj.registed_at;
  }

  toObject(): RequiredId<ServiceLogObject> {
    return {
      id: this.id,
      commission: this.#commission.toObject(),
      customer_id: this.#customer_id,
      tenant_id: this.#tenant_id,
      paid_amount: this.#paid_amount,
      registed_at: this.#registed_at,
    };
  }
}