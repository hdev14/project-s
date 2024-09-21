import Aggregate, { AggregateProps, AggregateRoot, RequiredProps } from "@shared/ddd/Aggregate";
import Address, { AddressValue } from "../../_shared/Address";
import Bank, { BankValue } from "./Bank";
import Brand, { BrandValue } from "./Brand";
import Employee, { EmployeeProps } from "./Employee";

export type CompanyProps = AggregateProps & {
  document: string;
  name: string;
  address: AddressValue;
  bank: BankValue;
  brand?: BrandValue;
  employees: Array<EmployeeProps>;
  access_plan_id: string;
};

export default class Company extends Aggregate<CompanyProps> implements AggregateRoot {
  #document: string;
  #name: string;
  #address: Address;
  #bank: Bank;
  #brand?: Brand;
  #access_plan_id: string;
  #employees: Array<Employee> = [];

  constructor(props: CompanyProps) {
    super(props);
    this.#document = props.document;
    this.#name = props.name;
    this.#address = new Address(
      props.address.street,
      props.address.district,
      props.address.state,
      props.address.number,
      props.address.complement,
    );
    this.#bank = new Bank(
      props.bank.account,
      props.bank.account_digit,
      props.bank.agency,
      props.bank.agency_digit,
      props.bank.bank_code,
    );
    if (props.brand) {
      this.#brand = new Brand(props.brand.color, props.brand.logo_url);
    }
    this.#access_plan_id = props.access_plan_id;
    for (let idx = 0; idx < props.employees.length; idx++) {
      this.#employees.push(new Employee(props.employees[idx]));
    }
  }

  set address(value: Address) {
    this.#address = value;
    this.update();
  }

  set bank(value: Bank) {
    this.#bank = value;
    this.update();
  }

  set brand(value: Brand) {
    this.#brand = value;
    this.update();
  }

  toObject(): RequiredProps<CompanyProps> {
    const employees = [];

    for (let idx = 0; idx < this.#employees.length; idx++) {
      employees.push(this.#employees[idx].toObject());
    }

    return {
      id: this.id,
      document: this.#document,
      name: this.#name,
      address: this.#address,
      bank: this.#bank,
      brand: this.#brand,
      access_plan_id: this.#access_plan_id,
      employees,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
