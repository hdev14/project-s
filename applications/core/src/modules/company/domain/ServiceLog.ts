import Aggregate, { AggregateProps, AggregateRoot, RequiredProps } from "@shared/ddd/Aggregate";

export type ServiceLogProps = AggregateProps & {
  commission_amount: number;
  employee_id: string;
  service_id: string;
  customer_id: string;
  tenant_id: string;
  paid_amount: number;
  registed_at: Date;
};

export default class ServiceLog extends Aggregate<ServiceLogProps> implements AggregateRoot {
  #commission_amount: number;
  #employee_id: string;
  #service_id: string;
  #customer_id: string;
  #tenant_id: string;
  #paid_amount: number;
  #registed_at: Date;

  constructor(props: ServiceLogProps) {
    super(props);
    this.#commission_amount = props.commission_amount;
    this.#employee_id = props.employee_id;
    this.#service_id = props.service_id;
    this.#customer_id = props.customer_id;
    this.#tenant_id = props.tenant_id;
    this.#paid_amount = props.paid_amount;
    this.#registed_at = props.registed_at;
  }

  static fromObject(props: ServiceLogProps) {
    return new ServiceLog(props);
  }

  toObject(): RequiredProps<ServiceLogProps> {
    return {
      id: this.id,
      commission_amount: this.#commission_amount,
      employee_id: this.#employee_id,
      service_id: this.#service_id,
      customer_id: this.#customer_id,
      tenant_id: this.#tenant_id,
      paid_amount: this.#paid_amount,
      registed_at: this.#registed_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
