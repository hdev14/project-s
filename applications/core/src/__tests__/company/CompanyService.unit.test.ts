import CompanyRepository from "@company/app/CompanyRepository";
import CompanyService from "@company/app/CompanyService";
import Company from "@company/domain/Company";
import { faker } from '@faker-js/faker/locale/pt_BR';
import CreateTenantUserCommand from "@shared/commands/CreateTenantUserCommand";
import AlreadyRegisteredError from "@shared/errors/AlreadyRegisteredError";
import NotFoundError from "@shared/errors/NotFoundError";
import EmailService from "@shared/infra/EmailService";
import { Policies } from "@shared/infra/Principal";
import Mediator from "@shared/Mediator";
import Collection from "@shared/utils/Collection";
import { mock } from 'jest-mock-extended';

describe('CompanyService unit tests', () => {
  const mediator_mock = mock<Mediator>();
  const email_service_mock = mock<EmailService>();
  const company_repository_mock = mock<CompanyRepository>();

  const company_service = new CompanyService(mediator_mock, email_service_mock, company_repository_mock);

  describe('CompanyService.createCompany', () => {
    it("creates a new company", async () => {
      const params = {
        name: faker.company.name(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        access_plan_id: faker.string.uuid(),
        address: {
          district: faker.location.secondaryAddress(),
          number: faker.string.numeric(),
          state: faker.location.state(),
          street: faker.location.street(),
          complement: faker.string.sample(),
        },
        bank: {
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
        }
      };

      const [data, error] = await company_service.createCompany(params);

      expect(error).toBeUndefined();
      expect(data).toHaveProperty('id');
      expect(company_repository_mock.updateCompany).toHaveBeenCalledTimes(1);
      const company = company_repository_mock.updateCompany.mock.calls[0][0].toObject();
      expect(company.address).toEqual(params.address);
      expect(company.bank).toEqual(params.bank);
      expect(company.document).toEqual(params.document);
      expect(company.name).toEqual(params.name);
      expect(mediator_mock.send).toHaveBeenCalledTimes(1);
      const mediator_command = mediator_mock.send.mock.calls[0][0];
      expect(mediator_command).toBeInstanceOf(CreateTenantUserCommand);
    });

    it("should return a not found error if access plan doesn't exist", async () => {
      mediator_mock.send.mockRejectedValueOnce(new NotFoundError('test'));

      const params = {
        name: faker.company.name(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        access_plan_id: faker.string.uuid(),
        address: {
          district: faker.location.secondaryAddress(),
          number: faker.string.numeric(),
          state: faker.location.state(),
          street: faker.location.street(),
          complement: faker.string.sample(),
        },
        bank: {
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
        }
      };

      const [data, error] = await company_service.createCompany(params);

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it("should send an email to the company main email address", async () => {
      const params = {
        name: faker.company.name(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        access_plan_id: faker.string.uuid(),
        address: {
          district: faker.location.secondaryAddress(),
          number: faker.string.numeric(),
          state: faker.location.state(),
          street: faker.location.street(),
          complement: faker.string.sample(),
        },
        bank: {
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
        }
      };

      await company_service.createCompany(params);

      expect(email_service_mock.send).toHaveBeenCalledTimes(1);
      expect(email_service_mock.send.mock.calls[0][0].email).toEqual(params.email);
    });

    it('should use the first 5 digits of the document as temp_password', async () => {
      const params = {
        name: faker.company.name(),
        email: faker.internet.email(),
        document: '12345678901234',
        access_plan_id: faker.string.uuid(),
        address: {
          district: faker.location.secondaryAddress(),
          number: faker.string.numeric(),
          state: faker.location.state(),
          street: faker.location.street(),
          complement: faker.string.sample(),
        },
        bank: {
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
        }
      };

      await company_service.createCompany(params);

      expect(mediator_mock.send).toHaveBeenCalledTimes(1);
      const mediator_command = mediator_mock.send.mock.calls[0][0] as CreateTenantUserCommand;
      expect(mediator_command.temp_password).toEqual('12345');
    });

    it('should add as default policies all non-secret policies', async () => {
      const params = {
        name: faker.company.name(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        access_plan_id: faker.string.uuid(),
        address: {
          district: faker.location.secondaryAddress(),
          number: faker.string.numeric(),
          state: faker.location.state(),
          street: faker.location.street(),
          complement: faker.string.sample(),
        },
        bank: {
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
        }
      };

      await company_service.createCompany(params);

      expect(mediator_mock.send).toHaveBeenCalledTimes(1);
      const mediator_command = mediator_mock.send.mock.calls[0][0] as CreateTenantUserCommand;
      expect(mediator_command.default_policies).toEqual([
        Policies.CREATE_TENANT_USER,
        Policies.LIST_USERS,
        Policies.UPDATE_USER,
        Policies.UPDATE_USER_POLICIES,
        Policies.LIST_POLICIES,
        Policies.UPDATE_CATALOG_ITEM,
        Policies.CREATE_CATALOG_ITEM,
        Policies.LIST_CATALOG_ITEMS,
      ]);
    });

    it('should return an already registered error if CompanyRepository.getCompanyByDocument returns a company', async () => {
      company_repository_mock.documentExists.mockResolvedValueOnce(true);

      const params = {
        name: faker.company.name(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        access_plan_id: faker.string.uuid(),
        address: {
          district: faker.location.secondaryAddress(),
          number: faker.string.numeric(),
          state: faker.location.state(),
          street: faker.location.street(),
          complement: faker.string.sample(),
        },
        bank: {
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
        }
      };

      const [data, error] = await company_service.createCompany(params);

      expect(data).toBeUndefined()
      expect(error).toBeInstanceOf(AlreadyRegisteredError);
    });
  });

  describe('CompanyService.getCompanies', () => {
    it('returns a list of users', async () => {
      company_repository_mock.getCompanies.mockResolvedValueOnce({
        results: new Collection([
          new Company({
            name: faker.company.name(),
            document: faker.string.numeric(14),
            access_plan_id: faker.string.uuid(),
            address: {
              district: faker.location.secondaryAddress(),
              number: faker.string.numeric(),
              state: faker.location.state(),
              street: faker.location.street(),
              complement: faker.string.sample(),
            },
            bank: {
              account: faker.string.numeric(5),
              account_digit: faker.string.numeric(1),
              agency: faker.string.numeric(4),
              agency_digit: faker.string.numeric(1),
              bank_code: faker.string.numeric(3),
            },
            employees: [],
          }),
          new Company({
            name: faker.company.name(),
            document: faker.string.numeric(14),
            access_plan_id: faker.string.uuid(),
            address: {
              district: faker.location.secondaryAddress(),
              number: faker.string.numeric(),
              state: faker.location.state(),
              street: faker.location.street(),
              complement: faker.string.sample(),
            },
            bank: {
              account: faker.string.numeric(5),
              account_digit: faker.string.numeric(1),
              agency: faker.string.numeric(4),
              agency_digit: faker.string.numeric(1),
              bank_code: faker.string.numeric(3),
            },
            employees: [],
          }),
        ]),
        page_result: {
          next_page: 2,
          total_of_pages: 2,
        }
      });

      const [data, error] = await company_service.getCompanies({});

      expect(error).toBeUndefined();
      expect(data!.results[0]).not.toBeInstanceOf(Company);
      expect(data!.results).toHaveLength(2);
      expect(data!.page_result).toEqual({
        next_page: 2,
        total_of_pages: 2
      });
    });
  });

  describe('CompanyService.getCompany', () => {
    it('returns a company', async () => {
      const company_obj = {
        id: faker.string.uuid(),
        name: faker.company.name(),
        document: faker.string.numeric(14),
        access_plan_id: faker.string.uuid(),
        address: {
          district: faker.location.secondaryAddress(),
          number: faker.string.numeric(),
          state: faker.location.state(),
          street: faker.location.street(),
          complement: faker.string.sample(),
        },
        bank: {
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
        },
        employees: [],
      };

      company_repository_mock.getCompanyById.mockResolvedValueOnce(
        new Company(company_obj)
      );

      const company_id = faker.string.uuid();

      const [data, error] = await company_service.getCompany({ company_id });

      expect(error).toBeUndefined();
      expect(data).toEqual(company_obj);
    });

    it("returns a not found error if company doesn't exist", async () => {
      company_repository_mock.getCompanyById.mockResolvedValueOnce(null);

      const company_id = faker.string.uuid();

      const [data, error] = await company_service.getCompany({ company_id });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
    });
  });

  describe('CompanyService.updateCompanyAddress', () => {
    it("returns a not found error if company doesn't exist", async () => {
      company_repository_mock.getCompanyById.mockResolvedValueOnce(null);

      const params = {
        company_id: faker.string.uuid(),
        street: faker.location.street(),
        district: faker.location.secondaryAddress(),
        state: faker.location.state(),
        number: faker.string.numeric(),
        complement: faker.string.sample(),
      };

      const [, error] = await company_service.updateCompanyAddress(params);

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it("updates a the company address", async () => {
      company_repository_mock.getCompanyById.mockResolvedValueOnce(
        new Company({
          id: faker.string.uuid(),
          name: faker.company.name(),
          document: faker.string.numeric(14),
          access_plan_id: faker.string.uuid(),
          address: {
            district: faker.location.secondaryAddress(),
            number: faker.string.numeric(),
            state: faker.location.state(),
            street: faker.location.street(),
            complement: faker.string.sample(),
          },
          bank: {
            account: faker.string.numeric(5),
            account_digit: faker.string.numeric(1),
            agency: faker.string.numeric(4),
            agency_digit: faker.string.numeric(1),
            bank_code: faker.string.numeric(3),
          },
          employees: [],
        })
      );

      const params = {
        company_id: faker.string.uuid(),
        street: faker.location.street(),
        district: faker.location.secondaryAddress(),
        state: faker.location.state(),
        number: faker.string.numeric(),
        complement: faker.string.sample(),
      };

      const [, error] = await company_service.updateCompanyAddress(params);

      expect(error).toBeUndefined();
      expect(company_repository_mock.updateCompany).toHaveBeenCalledTimes(1);
      const company = company_repository_mock.updateCompany.mock.calls[0][0].toObject();
      expect(company.address).toEqual({
        street: params.street,
        district: params.district,
        state: params.state,
        number: params.number,
        complement: params.complement,
      });
    });
  });

  describe('CompanyService.updateCompanyBank', () => {
    it("returns a not found error if company doesn't exist", async () => {
      company_repository_mock.getCompanyById.mockResolvedValueOnce(null);

      const params = {
        company_id: faker.string.uuid(),
        account: faker.string.numeric(5),
        account_digit: faker.string.numeric(2),
        agency: faker.string.numeric(4),
        agency_digit: faker.string.numeric(1),
        bank_code: faker.string.numeric(3),
      };

      const [, error] = await company_service.updateCompanyBank(params);

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it("updates a the company bank", async () => {
      company_repository_mock.getCompanyById.mockResolvedValueOnce(
        new Company({
          id: faker.string.uuid(),
          name: faker.company.name(),
          document: faker.string.numeric(14),
          access_plan_id: faker.string.uuid(),
          address: {
            district: faker.location.secondaryAddress(),
            number: faker.string.numeric(),
            state: faker.location.state(),
            street: faker.location.street(),
            complement: faker.string.sample(),
          },
          bank: {
            account: faker.string.numeric(5),
            account_digit: faker.string.numeric(1),
            agency: faker.string.numeric(4),
            agency_digit: faker.string.numeric(1),
            bank_code: faker.string.numeric(3),
          },
          employees: [],
        })
      );

      const params = {
        company_id: faker.string.uuid(),
        account: faker.string.numeric(5),
        account_digit: faker.string.numeric(2),
        agency: faker.string.numeric(4),
        agency_digit: faker.string.numeric(1),
        bank_code: faker.string.numeric(3),
      };

      const [, error] = await company_service.updateCompanyBank(params);

      expect(error).toBeUndefined();
      expect(company_repository_mock.updateCompany).toHaveBeenCalledTimes(1);
      const company = company_repository_mock.updateCompany.mock.calls[0][0].toObject();
      expect(company.bank).toEqual({
        account: params.account,
        account_digit: params.account_digit,
        agency: params.agency,
        agency_digit: params.agency_digit,
        bank_code: params.bank_code,
      });
    });
  });

  describe('CompanyService.updateCompanyBrand', () => {
    it("returns a not found error if company doesn't exist", async () => {
      company_repository_mock.getCompanyById.mockResolvedValueOnce(null);

      const params = {
        company_id: faker.string.uuid(),
        color: faker.color.rgb(),
        logo_url: faker.internet.url(),
      };

      const [, error] = await company_service.updateCompanyBrand(params);

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it("updates a the company brand", async () => {
      company_repository_mock.getCompanyById.mockResolvedValueOnce(
        new Company({
          id: faker.string.uuid(),
          name: faker.company.name(),
          document: faker.string.numeric(14),
          access_plan_id: faker.string.uuid(),
          address: {
            district: faker.location.secondaryAddress(),
            number: faker.string.numeric(),
            state: faker.location.state(),
            street: faker.location.street(),
            complement: faker.string.sample(),
          },
          bank: {
            account: faker.string.numeric(5),
            account_digit: faker.string.numeric(1),
            agency: faker.string.numeric(4),
            agency_digit: faker.string.numeric(1),
            bank_code: faker.string.numeric(3),
          },
          employees: [],
        })
      );

      const params = {
        company_id: faker.string.uuid(),
        color: faker.color.rgb(),
        logo_url: faker.internet.url(),
      };

      const [, error] = await company_service.updateCompanyBrand(params);

      expect(error).toBeUndefined();
      expect(company_repository_mock.updateCompany).toHaveBeenCalledTimes(1);
      const company = company_repository_mock.updateCompany.mock.calls[0][0].toObject();
      expect(company.brand).toEqual({
        color: params.color,
        logo_url: params.logo_url,
      });
    });
  });
});