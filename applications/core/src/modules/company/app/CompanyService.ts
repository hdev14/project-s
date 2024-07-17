import { BankValue } from "@company/domain/Bank";
import { AddressValue } from "@shared/Address";
import Mediator from "@shared/Mediator";
import CreateTenantUserCommand from "@shared/commands/CreateTenantUserCommand";
import AlreadyRegisteredError from "@shared/errors/AlreadyRegisteredError";
import EmailService from "@shared/infra/EmailService";
import { Policies } from "@shared/infra/Principal";
import Either from "@shared/utils/Either";
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

  async updateCompany(params: {}): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async getCompanies(params: {}): Promise<Either<Array<CompanyObject>>> {
    return Either.left(new Error());
  }
}