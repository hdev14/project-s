import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";

export type ServiceLogObject = {
  id?: string;
  commission_amount: number;
  employee_id: string;
  service_id: string;
  customer_id: string;
  tenant_id: string;
  paid_amount: number;
  registed_at: Date;
};

export default class ServiceLog extends Aggregate<ServiceLogObject> implements AggregateRoot {
  #commission_amount: number;
  #employee_id: string;
  #service_id: string;
  #customer_id: string;
  #tenant_id: string;
  #paid_amount: number;
  #registed_at: Date;

  constructor(obj: ServiceLogObject) {
    super(obj.id);
    this.#commission_amount = obj.commission_amount;
    this.#employee_id = obj.employee_id;
    this.#service_id = obj.service_id;
    this.#customer_id = obj.customer_id;
    this.#tenant_id = obj.tenant_id;
    this.#paid_amount = obj.paid_amount;
    this.#registed_at = obj.registed_at;
  }

  toObject(): RequiredId<ServiceLogObject> {
    return {
      id: this.id,
      commission_amount: this.#commission_amount,
      employee_id: this.#employee_id,
      service_id: this.#service_id,
      customer_id: this.#customer_id,
      tenant_id: this.#tenant_id,
      paid_amount: this.#paid_amount,
      registed_at: this.#registed_at,
    };
  }
}