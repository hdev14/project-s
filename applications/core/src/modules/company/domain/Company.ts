import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";
import Address, { AddressValue } from "../../_shared/Address";
import Bank, { BankValue } from "./Bank";
import Brand, { BrandValue } from "./Brand";
import Employee, { EmployeeObject } from "./Employee";

export type CompanyObject = {
  id?: string;
  document: string;
  name: string;
  address: AddressValue;
  bank: BankValue;
  brand: BrandValue;
  employees: Array<EmployeeObject>;
  registration_plan_id: string;
};

export default class Company extends Aggregate<CompanyObject> implements AggregateRoot {
  #document: string;
  #name: string;
  #address: Address;
  #bank: Bank;
  #brand: Brand;
  #registration_plan_id: string;
  #employees: Array<Employee> = [];

  constructor(obj: CompanyObject) {
    super(obj.id);
    this.#document = obj.document;
    this.#name = obj.name;
    this.#address = new Address(
      obj.address.street,
      obj.address.district,
      obj.address.state,
      obj.address.number,
      obj.address.complement,
    );
    this.#bank = new Bank(
      obj.bank.account,
      obj.bank.account_digit,
      obj.bank.agency,
      obj.bank.agency_digit,
      obj.bank.bank_code,
    );
    this.#brand = new Brand(obj.brand.color, obj.brand.logo_url);
    this.#registration_plan_id = obj.registration_plan_id;
    for (let idx = 0; idx < obj.employees.length; idx++) {
      this.#employees.push(new Employee(obj.employees[idx]));
    }
  }

  toObject(): RequiredId<CompanyObject> {
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
      registration_plan_id: this.#registration_plan_id,
      employees,
    };
  }
}