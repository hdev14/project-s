import Bank, { BankValue } from "@company/domain/Bank";
import Brand from "@company/domain/Brand";
import Commission, { CommissionProps, TaxTypes } from "@company/domain/Commission";
import Employee, { EmployeeProps } from "@company/domain/Employee";
import ServiceLog, { ServiceLogProps } from "@company/domain/ServiceLog";
import EmailService from "@global/app/EmailService";
import FileStorage from "@global/app/FileStorage";
import Address, { AddressValue } from "@shared/Address";
import Mediator from "@shared/Mediator";
import { Policies } from "@shared/Principal";
import UserTypes from "@shared/UserTypes";
import CreateUserCommand from "@shared/commands/CreateUserCommand";
import GetCatalogItemCommand from "@shared/commands/GetCatalogItemCommand";
import GetUserCommand from "@shared/commands/GetUserCommand";
import AlreadyRegisteredError from "@shared/errors/AlreadyRegisteredError";
import DomainError from "@shared/errors/DomainError";
import NotFoundError from "@shared/errors/NotFoundError";
import types from "@shared/types";
import Either from "@shared/utils/Either";
import { PageOptions, PageResult } from "@shared/utils/Pagination";
import { inject, injectable } from "inversify";
import 'reflect-metadata';
import Company, { CompanyProps } from "../domain/Company";
import CommissionRepository from "./CommissionRepository";
import CompanyRepository from "./CompanyRepository";
import ServiceLogRepository from "./ServiceLogRepository";

export type CreateCompanyParams = {
  name: string;
  email: string;
  document: string;
  access_plan_id: string;
  bank: BankValue;
  address: AddressValue;
};

export type GetCompanisParams = {
  page_options?: PageOptions;
};

export type GetCompaniesResult = {
  results: Array<CompanyProps>;
  page_result?: PageResult;
};

export type GetCompanyParams = {
  company_id: string;
};

export type UpdateCompanyAddressParams = {
  company_id: string;
} & Partial<AddressValue>;

export type UpdateCompanyBankParams = {
  company_id: string;
} & Partial<BankValue>;

export type UpdateCompanyBrandParams = {
  company_id: string;
  color: string;
  logo_file: Buffer;
};

export type CreateEmployeeParams = {
  name: string;
  document: string;
  email: string;
  tenant_id: string;
  policies: string[];
};

export type DeactivateEmploeeParams = {
  employee_id: string;
};

export type CreateServiceLogParams = {
  employee_id: string;
  service_id: string;
  customer_id: string;
  tenant_id: string;
};

export type GetServiceLogsParams = {
  tenant_id: string;
  page_options?: PageOptions;
};

export type GetServiceLogsResult = {
  results: Array<ServiceLogProps>;
  page_result?: PageResult;
};

export type CreateCommissionParams = {
  catalog_item_id: string;
  tax: number;
  tax_type: TaxTypes;
  tenant_id: string;
};

export type UpdateCommissionParams = {
  commission_id: string;
  tax: number;
  tax_type: TaxTypes;
};

export type GetCommissionsParams = {
  commission_id: string;
};

@injectable()
export default class CompanyService {
  #mediator: Mediator;
  #email_service: EmailService;
  #company_repository: CompanyRepository;
  #service_log_repository: ServiceLogRepository;
  #commission_repository: CommissionRepository;
  #file_storage: FileStorage;

  constructor(
    @inject(types.Mediator) mediator: Mediator,
    @inject(types.EmailService) email_service: EmailService,
    @inject(types.CompanyRepository) company_repository: CompanyRepository,
    @inject(types.ServiceLogRepository) service_log_repository: ServiceLogRepository,
    @inject(types.CommissionRepository) commission_repository: CommissionRepository,
    @inject(types.FileStorage) file_storage: FileStorage,
  ) {
    this.#mediator = mediator;
    this.#email_service = email_service;
    this.#company_repository = company_repository;
    this.#service_log_repository = service_log_repository;
    this.#commission_repository = commission_repository;
    this.#file_storage = file_storage;
  }

  async createCompany(params: CreateCompanyParams): Promise<Either<CompanyProps>> {
    try {
      const exists = await this.#company_repository.documentExists(params.document);

      if (exists) {
        return Either.left(new AlreadyRegisteredError('already_registered_company'));
      }

      const user_id = await this.#mediator.send<string>(new CreateUserCommand({
        email: params.email,
        temp_password: params.document.slice(0, 5),
        access_plan_id: params.access_plan_id,
        default_policies: [
          Policies.CREATE_TENANT_USER,
          Policies.LIST_USERS,
          Policies.UPDATE_USER,
          Policies.UPDATE_USER_POLICIES,
          Policies.LIST_POLICIES,
          Policies.UPDATE_CATALOG_ITEM,
          Policies.CREATE_CATALOG_ITEM,
          Policies.LIST_CATALOG_ITEMS,
        ],
        type: UserTypes.COMPANY,
      }));

      const company = new Company({
        id: user_id,
        name: params.name,
        access_plan_id: params.access_plan_id,
        address: params.address,
        bank: params.bank,
        document: params.document,
        employees: [],
      });

      await this.#company_repository.updateCompany(company);

      await this.#file_storage.createBucket(`tenant-${company.id}`);

      await this.#email_service.send({
        email: params.email,
        message: 'Para efetuar o primeiro acesso a plataforma utilize como senha os primeiros 5 digitos do CNPJ da empresa cadastrada.',
        title: 'Empresa cadastra!'
      });

      return Either.right(company.toObject());
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return Either.left(error);
      }

      throw error;
    }
  }

  async getCompanies(params: GetCompanisParams): Promise<Either<GetCompaniesResult>> {
    return Either.right(await this.#company_repository.getCompanies(params));
  }

  async getCompany(params: GetCompanyParams): Promise<Either<CompanyProps>> {
    const company = await this.#company_repository.getCompanyById(params.company_id);

    if (!company) {
      return Either.left(new NotFoundError('notfound.company'));
    }

    return Either.right(company.toObject());
  }

  async updateCompanyAddress(params: UpdateCompanyAddressParams): Promise<Either<void>> {
    const company = await this.#company_repository.getCompanyById(params.company_id);

    if (!company) {
      return Either.left(new NotFoundError('notfound.company'));
    }

    const current_address = company.toObject().address;

    company.address = new Address(
      params.street ?? current_address.street,
      params.district ?? current_address.district,
      params.state ?? current_address.state,
      params.number ?? current_address.number,
      params.complement ?? current_address.complement,
    );;

    await this.#company_repository.updateCompany(company);

    return Either.right();
  }

  async updateCompanyBank(params: UpdateCompanyBankParams): Promise<Either<void>> {
    const company = await this.#company_repository.getCompanyById(params.company_id);

    if (!company) {
      return Either.left(new NotFoundError('notfound.company'));
    }

    const current_bank = company.toObject().bank;

    company.bank = new Bank(
      params.account ?? current_bank.account,
      params.account_digit ?? current_bank.account_digit,
      params.agency ?? current_bank.agency,
      params.agency_digit ?? current_bank.agency_digit,
      params.bank_code ?? current_bank.bank_code,
    );

    await this.#company_repository.updateCompany(company);

    return Either.right();
  }

  async updateCompanyBrand(params: UpdateCompanyBrandParams): Promise<Either<void>> {
    const company = await this.#company_repository.getCompanyById(params.company_id);

    if (!company) {
      return Either.left(new NotFoundError('notfound.company'));
    }

    const logo_url = await this.#file_storage.storeFile({
      bucket_name: `tenant-${company.id}`,
      file: params.logo_file,
      folder: 'logos',
      name: `logo_${company.id}`,
    });

    company.brand = new Brand(params.color, logo_url);

    await this.#company_repository.updateCompany(company);

    return Either.right();
  }

  async createEmployee(params: CreateEmployeeParams): Promise<Either<EmployeeProps>> {
    if (!await this.#mediator.send<any>(new GetUserCommand(params.tenant_id))) {
      return Either.left(new NotFoundError('notfound.company'));
    }

    const user_id = await this.#mediator.send<string>(new CreateUserCommand({
      default_policies: params.policies,
      email: params.email,
      temp_password: params.document.slice(0, 6),
      tenant_id: params.tenant_id,
      type: UserTypes.EMPLOYEE,
    }));

    const employee = new Employee({
      id: user_id,
      document: params.document,
      email: params.email,
      name: params.name,
    });

    await this.#company_repository.updateEmployee(employee);

    await this.#email_service.send({
      email: params.email,
      message: 'Para efetuar o primeiro acesso a plataforma utilize como senha os primeiros 6 digitos do CPF.',
      title: 'Colaborador cadastrado!'
    });

    return Either.right(employee.toObject());
  }

  async deactivateEmployee(params: DeactivateEmploeeParams): Promise<Either<void>> {
    const employee = await this.#company_repository.getEmployeeById(params.employee_id);

    if (!employee) {
      return Either.left(new NotFoundError('notfound.employee'));
    }

    employee.deactive();

    await this.#company_repository.updateEmployee(employee);

    return Either.right();
  }

  async createServiceLog(params: CreateServiceLogParams): Promise<Either<ServiceLogProps>> {
    try {
      const has_employee = await this.#mediator.send<any>(new GetUserCommand(params.employee_id));

      if (!has_employee) {
        return Either.left(new NotFoundError('notfound.employee'));
      }

      const has_customer = await this.#mediator.send<any>(new GetUserCommand(params.customer_id));

      if (!has_customer) {
        return Either.left(new NotFoundError('notfound.customer'));
      }

      const commission = await this.#commission_repository.getCommissionByCatalogItemId(params.service_id);

      const catalog_item = await this.#mediator.send<any>(new GetCatalogItemCommand(params.service_id));

      const service_log = new ServiceLog({
        commission_amount: commission ? commission.calculate(catalog_item.amount) : 0,
        customer_id: params.customer_id,
        employee_id: params.employee_id,
        paid_amount: catalog_item.amount,
        service_id: params.service_id,
        tenant_id: params.tenant_id,
        registed_at: new Date(),
      });

      return Either.right(service_log.toObject());
    } catch (error) {
      if (error instanceof NotFoundError) {
        return Either.left(error);
      }

      throw error;
    }
  }

  async getServiceLogs(params: GetServiceLogsParams): Promise<Either<GetServiceLogsResult>> {
    return Either.right(await this.#service_log_repository.getServiceLogs(params));
  }

  async createCommission(params: CreateCommissionParams): Promise<Either<CommissionProps>> {
    try {
      await this.#mediator.send(new GetCatalogItemCommand(params.catalog_item_id));

      const commission = new Commission(params);

      await this.#commission_repository.createCommission(commission);

      return Either.right(commission.toObject());
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DomainError) {
        return Either.left(error);
      }

      throw error;
    }
  }

  async updateCommission(params: UpdateCommissionParams): Promise<Either<void>> {
    const commission = await this.#commission_repository.getCommissionById(params.commission_id);

    if (!commission) {
      return Either.left(new NotFoundError('notfound.commission'));
    }

    commission.tax_type = params.tax_type;
    commission.tax = params.tax;

    await this.#commission_repository.updateCommission(commission);

    return Either.right();
  }

  async getCommission(params: GetCommissionsParams): Promise<Either<CommissionProps>> {
    const commission = await this.#commission_repository.getCommissionById(params.commission_id);

    if (!commission) {
      return Either.left(new NotFoundError('notfound.commission'));
    }

    return Either.right(commission.toObject());
  }
}
