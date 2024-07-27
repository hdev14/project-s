import Bank, { BankValue } from "@company/domain/Bank";
import Brand, { BrandValue } from "@company/domain/Brand";
import Commission, { CommissionObject, TaxTypes } from "@company/domain/Commission";
import Employee, { EmployeeObject } from "@company/domain/Employee";
import ServiceLog, { ServiceLogObject } from "@company/domain/ServiceLog";
import Address, { AddressValue } from "@shared/Address";
import Mediator from "@shared/Mediator";
import CreateUserCommand from "@shared/commands/CreateUserCommand";
import GetCatalogItemCommand from "@shared/commands/GetCatalogItemCommand";
import UserExistsCommand from "@shared/commands/UserExistsCommand";
import AlreadyRegisteredError from "@shared/errors/AlreadyRegisteredError";
import DomainError from "@shared/errors/DomainError";
import NotFoundError from "@shared/errors/NotFoundError";
import EmailService from "@shared/infra/EmailService";
import { Policies } from "@shared/infra/Principal";
import Either from "@shared/utils/Either";
import { PageOptions, PageResult } from "@shared/utils/Pagination";
import Company, { CompanyObject } from "../domain/Company";
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
  results: Array<CompanyObject>;
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
} & BrandValue;

export type CreateEmployeeParams = {
  name: string;
  document: string;
  email: string;
  tenant_id: string;
  policies: string[];
};

export type DeactivateEmploeeParams = {};

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
  results: Array<ServiceLogObject>;
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

export type GetCommissionsParams = {};

export default class CompanyService {
  #mediator: Mediator;
  #email_service: EmailService;
  #company_repository: CompanyRepository;
  #service_log_repository: ServiceLogRepository;
  #commission_repository: CommissionRepository;

  constructor(
    mediator: Mediator,
    email_service: EmailService,
    company_repository: CompanyRepository,
    service_log_repository: ServiceLogRepository,
    commission_repository: CommissionRepository,
  ) {
    this.#mediator = mediator;
    this.#email_service = email_service;
    this.#company_repository = company_repository;
    this.#service_log_repository = service_log_repository;
    this.#commission_repository = commission_repository;
  }

  async createCompany(params: CreateCompanyParams): Promise<Either<CompanyObject>> {
    try {
      const exists = await this.#company_repository.documentExists(params.document);

      if (exists) {
        return Either.left(new AlreadyRegisteredError('CNPJ já cadastrado'));
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

      await this.#email_service.send({
        email: params.email,
        message: 'Para efetuar o primeiro acesso a plataforma utilize como senha os primeiros 5 digitos do CNPJ da empresa cadastrada.',
        title: 'Empresa cadastra!'
      });

      return Either.right(company.toObject());
    } catch (error: any) {
      return Either.left(error);
    }
  }

  async getCompanies(params: GetCompanisParams): Promise<Either<GetCompaniesResult>> {
    const { results, page_result } = await this.#company_repository.getCompanies(params);

    return Either.right({ results: results.toObjectList(), page_result });
  }

  async getCompany(params: GetCompanyParams): Promise<Either<CompanyObject>> {
    const company = await this.#company_repository.getCompanyById(params.company_id);

    if (!company) {
      return Either.left(new NotFoundError('Empresa não encontrado'));
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

    const current_brand = company.toObject().brand;

    if (!current_brand) {
      company.brand = new Brand(params.color, params.logo_url);
    } else {
      company.brand = new Brand(
        params.color ?? current_brand.color,
        params.logo_url ?? current_brand.logo_url
      );
    }

    await this.#company_repository.updateCompany(company);

    return Either.right();
  }

  async createEmployee(params: CreateEmployeeParams): Promise<Either<EmployeeObject>> {
    if (!await this.#mediator.send<boolean>(new UserExistsCommand(params.tenant_id))) {
      return Either.left(new NotFoundError('notfound.company'));
    }

    const user_id = await this.#mediator.send<string>(new CreateUserCommand({
      default_policies: params.policies,
      email: params.email,
      temp_password: params.document.slice(0, 6),
      tenant_id: params.tenant_id,
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
    return Either.left(new Error());
  }

  async createServiceLog(params: CreateServiceLogParams): Promise<Either<ServiceLogObject>> {
    try {
      const has_employee = await this.#mediator.send<boolean>(new UserExistsCommand(params.employee_id));

      if (!has_employee) {
        return Either.left(new NotFoundError('notfound.employee'));
      }

      const has_customer = await this.#mediator.send<boolean>(new UserExistsCommand(params.customer_id));

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
    const { results, page_result } = await this.#service_log_repository.getServiceLogs(params);

    return Either.right({ results: results.toObjectList(), page_result });
  }

  async createCommission(params: CreateCommissionParams): Promise<Either<CommissionObject>> {
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
}