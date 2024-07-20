import Bank, { BankValue } from "@company/domain/Bank";
import Brand, { BrandValue } from "@company/domain/Brand";
import Address, { AddressValue } from "@shared/Address";
import Mediator from "@shared/Mediator";
import CreateTenantUserCommand from "@shared/commands/CreateTenantUserCommand";
import AlreadyRegisteredError from "@shared/errors/AlreadyRegisteredError";
import NotFoundError from "@shared/errors/NotFoundError";
import EmailService from "@shared/infra/EmailService";
import { Policies } from "@shared/infra/Principal";
import Either from "@shared/utils/Either";
import { PageOptions, PageResult } from "@shared/utils/Pagination";
import Company, { CompanyObject } from "../domain/Company";
import CompanyRepository from "./CompanyRepository";

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

export type AddEmployeeParams = {};

export type DeactivateEmploeeParams = {};

export type RegisterServiceLogParams = {};

export type GetServiceLogsParams = {};

export type CreateCommissionParams = {};

export type UpdateCommissionParams = {};

export type GetCommissionsParams = {};

export default class CompanyService {
  #mediator: Mediator;
  #email_service: EmailService;
  #company_repository: CompanyRepository;

  constructor(
    mediator: Mediator,
    email_service: EmailService,
    company_repository: CompanyRepository,
  ) {
    this.#mediator = mediator;
    this.#email_service = email_service;
    this.#company_repository = company_repository;
  }

  async createCompany(params: CreateCompanyParams): Promise<Either<CompanyObject>> {
    try {
      const exists = await this.#company_repository.documentExists(params.document);

      if (exists) {
        return Either.left(new AlreadyRegisteredError('CNPJ já cadastrado'));
      }

      const tenant_id = await this.#mediator.send<string>(new CreateTenantUserCommand({
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
        id: tenant_id,
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

  async addEmployee(params: AddEmployeeParams): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async deactivateEmployee(params: DeactivateEmploeeParams): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async createServiceLog(params: RegisterServiceLogParams): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async getServiceLogs(params: GetServiceLogsParams): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async createCommission(params: CreateCommissionParams): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async updateCommission(params: UpdateCommissionParams): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async getCommissions(params: GetCommissionsParams): Promise<Either<void>> {
    return Either.left(new Error());
  }
}