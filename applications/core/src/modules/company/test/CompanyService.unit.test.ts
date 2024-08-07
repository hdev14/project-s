import CommissionRepository from "@company/app/CommissionRepository";
import CompanyRepository from "@company/app/CompanyRepository";
import CompanyService from "@company/app/CompanyService";
import ServiceLogRepository from "@company/app/ServiceLogRepository";
import Commission, { TaxTypes } from "@company/domain/Commission";
import Company from "@company/domain/Company";
import Employee from "@company/domain/Employee";
import ServiceLog from "@company/domain/ServiceLog";
import { faker } from '@faker-js/faker/locale/pt_BR';
import CreateUserCommand from "@shared/commands/CreateUserCommand";
import AlreadyRegisteredError from "@shared/errors/AlreadyRegisteredError";
import DomainError from "@shared/errors/DomainError";
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
  const service_log_repository_mock = mock<ServiceLogRepository>();
  const commission_repository_mock = mock<CommissionRepository>();

  const company_service = new CompanyService(
    mediator_mock,
    email_service_mock,
    company_repository_mock,
    service_log_repository_mock,
    commission_repository_mock,
  );

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
      expect(mediator_command).toBeInstanceOf(CreateUserCommand);
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
      const mediator_command = mediator_mock.send.mock.calls[0][0] as CreateUserCommand;
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
      const mediator_command = mediator_mock.send.mock.calls[0][0] as CreateUserCommand;
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
    it('returns a list of companies', async () => {
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

  describe('CompanyService.getServiceLogs', () => {
    it('returns a list of service logs', async () => {
      service_log_repository_mock.getServiceLogs.mockResolvedValueOnce({
        results: new Collection([
          new ServiceLog({
            commission_amount: faker.number.float(),
            customer_id: faker.string.uuid(),
            employee_id: faker.string.uuid(),
            paid_amount: faker.number.float(),
            registed_at: faker.date.anytime(),
            service_id: faker.string.uuid(),
            tenant_id: faker.string.uuid(),
          }),
          new ServiceLog({
            commission_amount: faker.number.float(),
            customer_id: faker.string.uuid(),
            employee_id: faker.string.uuid(),
            paid_amount: faker.number.float(),
            registed_at: faker.date.anytime(),
            service_id: faker.string.uuid(),
            tenant_id: faker.string.uuid(),
          }),
        ]),
        page_result: {
          next_page: 2,
          total_of_pages: 2,
        }
      });

      const [data, error] = await company_service.getServiceLogs({
        tenant_id: faker.string.uuid(),
      });

      expect(error).toBeUndefined();
      expect(data!.results[0]).not.toBeInstanceOf(ServiceLog);
      expect(data!.results).toHaveLength(2);
      expect(data!.page_result).toEqual({
        next_page: 2,
        total_of_pages: 2
      });
    });
  });

  describe('CompanyService.createServiceLog', () => {
    it("should return not found error if employee doesn't exist", async () => {
      mediator_mock.send.mockResolvedValueOnce(false);

      const [data, error] = await company_service.createServiceLog({
        customer_id: faker.string.uuid(),
        employee_id: faker.string.uuid(),
        service_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.employee');
    });

    it("should return not found error if employee doesn't exist", async () => {
      mediator_mock.send
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const [data, error] = await company_service.createServiceLog({
        customer_id: faker.string.uuid(),
        employee_id: faker.string.uuid(),
        service_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.customer');
    });

    it("should return not found error if service doesn't exist", async () => {
      mediator_mock.send
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new NotFoundError('notfound.catalog_item'));

      const [data, error] = await company_service.createServiceLog({
        customer_id: faker.string.uuid(),
        employee_id: faker.string.uuid(),
        service_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.catalog_item');
    });


    it("should create a service log without commission amount", async () => {
      const service_amount = faker.number.float();

      mediator_mock.send
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce({
          amount: service_amount,
        });

      commission_repository_mock.getCommissionByCatalogItemId.mockResolvedValueOnce(null);

      const params = {
        customer_id: faker.string.uuid(),
        employee_id: faker.string.uuid(),
        service_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      };

      const [data, error] = await company_service.createServiceLog(params);

      expect(error).toBeUndefined();
      expect(data!.id).toBeDefined();
      expect(data!.customer_id).toEqual(params.customer_id);
      expect(data!.employee_id).toEqual(params.employee_id);
      expect(data!.service_id).toEqual(params.service_id);
      expect(data!.tenant_id).toEqual(params.tenant_id);
      expect(data!.paid_amount).toEqual(service_amount);
      expect(data!.commission_amount).toEqual(0);
    });

    it("should create a new service log with commission amount", async () => {
      const service_amount = faker.number.float();

      mediator_mock.send
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce({
          amount: service_amount,
        })

      const commission = new Commission({
        catalog_item_id: faker.string.uuid(),
        tax: faker.number.float(),
        tax_type: faker.helpers.enumValue(TaxTypes),
        tenant_id: faker.string.uuid(),
      });

      commission_repository_mock.getCommissionByCatalogItemId.mockResolvedValueOnce(commission);

      const params = {
        customer_id: faker.string.uuid(),
        employee_id: faker.string.uuid(),
        service_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      };

      const [data, error] = await company_service.createServiceLog(params);

      expect(error).toBeUndefined();
      expect(data!.id).toBeDefined();
      expect(data!.customer_id).toEqual(params.customer_id);
      expect(data!.employee_id).toEqual(params.employee_id);
      expect(data!.service_id).toEqual(params.service_id);
      expect(data!.tenant_id).toEqual(params.tenant_id);
      expect(data!.paid_amount).toEqual(service_amount);
      expect(data!.commission_amount).toBeGreaterThan(0);
    });
  });

  describe('CompanyService.createCommission', () => {
    it("should return not found error if catalog item doesn't exist", async () => {
      mediator_mock.send.mockRejectedValueOnce(new NotFoundError('test'));

      const [data, error] = await company_service.createCommission({
        catalog_item_id: faker.string.uuid(),
        tax: faker.number.float(),
        tax_type: TaxTypes.PERCENTAGE,
        tenant_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should return a domain error if tax type is "percentage" and the amount is greater than 1', async () => {
      mediator_mock.send.mockResolvedValueOnce({ id: faker.string.uuid() });

      const [data, error] = await company_service.createCommission({
        catalog_item_id: faker.string.uuid(),
        tax: faker.number.int({ min: 2 }),
        tax_type: TaxTypes.PERCENTAGE,
        tenant_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(DomainError);
      expect(error!.message).toEqual('tax_percentage_error');
    });

    it('creates a new commission', async () => {
      mediator_mock.send.mockResolvedValueOnce({ id: faker.string.uuid() });

      const params = {
        catalog_item_id: faker.string.uuid(),
        tax: faker.number.float({ max: 1 }),
        tax_type: TaxTypes.PERCENTAGE,
        tenant_id: faker.string.uuid(),
      };

      const [data, error] = await company_service.createCommission(params);

      expect(commission_repository_mock.createCommission).toHaveBeenCalledTimes(1);
      expect(error).toBeUndefined();
      expect(data!.id).toBeDefined();
      expect(data!.tax).toEqual(params.tax);
      expect(data!.tax_type).toEqual(params.tax_type);
      expect(data!.tenant_id).toEqual(params.tenant_id);
    });
  });

  describe('CompanyService.updateCommission', () => {
    it("returns a not found error if commission doesn't exist", async () => {
      commission_repository_mock.getCommissionById.mockResolvedValueOnce(null)

      const params = {
        commission_id: faker.string.uuid(),
        tax: faker.number.float(),
        tax_type: TaxTypes.RAW,
      };

      const [, error] = await company_service.updateCommission(params);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.commission');
    });

    it("updates a commission", async () => {
      commission_repository_mock.getCommissionById.mockResolvedValueOnce(
        new Commission({
          id: faker.string.uuid(),
          tax: faker.number.float(),
          tax_type: TaxTypes.RAW,
          tenant_id: faker.string.uuid(),
          catalog_item_id: faker.string.uuid(),
        })
      );


      const params = {
        commission_id: faker.string.uuid(),
        tax: faker.number.float(),
        tax_type: TaxTypes.RAW,
      };

      const [, error] = await company_service.updateCommission(params);

      expect(error).toBeUndefined();
      expect(commission_repository_mock.updateCommission).toHaveBeenCalledTimes(1);
      const commission = commission_repository_mock.updateCommission.mock.calls[0][0].toObject();
      expect(commission.tax).toEqual(params.tax);
      expect(commission.tax_type).toEqual(params.tax_type);
    });
  });

  describe('CompanyService.createEmployee', () => {
    it("returns a not found error if tenant doesn't exist", async () => {
      mediator_mock.send.mockResolvedValueOnce(false);

      const [data, error] = await company_service.createEmployee({
        document: faker.string.numeric(11),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        tenant_id: faker.string.uuid(),
        policies: [faker.helpers.enumValue(Policies)]
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.company');
    });

    it("should create a new user for the employee", async () => {
      const user_id = faker.string.uuid();
      mediator_mock.send.mockResolvedValueOnce(true);
      mediator_mock.send.mockResolvedValueOnce(user_id);

      const params = {
        document: '12345678910',
        email: faker.internet.email(),
        name: faker.person.fullName(),
        tenant_id: faker.string.uuid(),
        policies: [faker.helpers.enumValue(Policies)]
      };

      await company_service.createEmployee(params);

      expect(mediator_mock.send).toHaveBeenCalledTimes(2);
      const command = mediator_mock.send.mock.calls[1][0] as any;
      expect(command.email).toEqual(params.email);
      expect(command.temp_password).toEqual('123456');
      expect(command.access_plan_id).toBeUndefined();
      expect(command.default_policies).toEqual(params.policies);
      expect(command.tenant_id).toEqual(params.tenant_id);
    });

    it("should create a new employee", async () => {
      const user_id = faker.string.uuid();
      mediator_mock.send.mockResolvedValueOnce(true);
      mediator_mock.send.mockResolvedValueOnce(user_id);

      const params = {
        document: '12345678910',
        email: faker.internet.email(),
        name: faker.person.fullName(),
        tenant_id: faker.string.uuid(),
        policies: [faker.helpers.enumValue(Policies)]
      };

      const [data, error] = await company_service.createEmployee(params);

      expect(company_repository_mock.updateEmployee).toHaveBeenCalled();
      expect(error).toBeUndefined();
      expect(data!.id).toEqual(user_id);
      expect(data!.document).toEqual(params.document);
      expect(data!.email).toEqual(params.email);
      expect(data!.name).toEqual(params.name);
    });

    it("should send a welcome email to the employee's email", async () => {
      mediator_mock.send.mockResolvedValueOnce(true);
      mediator_mock.send.mockResolvedValueOnce(faker.string.uuid());

      const params = {
        document: faker.string.numeric(11),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        tenant_id: faker.string.uuid(),
        policies: [faker.helpers.enumValue(Policies)]
      };

      await company_service.createEmployee(params);

      expect(email_service_mock.send).toHaveBeenCalledWith({
        email: params.email,
        message: 'Para efetuar o primeiro acesso a plataforma utilize como senha os primeiros 6 digitos do CPF.',
        title: 'Colaborador cadastrado!'
      });
    });
  });

  describe('CompanyService.deactivateEmployee', () => {
    it("returns a not found error if employee doesn't exist", async () => {
      company_repository_mock.getEmployeeById.mockResolvedValueOnce(null);

      const [, error] = await company_service.deactivateEmployee({
        employee_id: faker.string.uuid(),
      });

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.employee');
    });

    it("should deactivate the employee", async () => {
      company_repository_mock.getEmployeeById.mockResolvedValueOnce(
        new Employee({
          document: faker.string.numeric(11),
          email: faker.internet.email(),
          name: faker.person.fullName(),
        }),
      )

      const [, error] = await company_service.deactivateEmployee({
        employee_id: faker.string.uuid(),
      });

      expect(error).toBeUndefined();
      expect(company_repository_mock.updateEmployee).toHaveBeenCalled();
      const obj = company_repository_mock.updateEmployee.mock.calls[0][0].toObject();
      expect(obj.deactivated_at).toBeTruthy();
    });
  });

  describe('CompanyService.getCommission', () => {
    it('returns a commission', async () => {
      const commission_obj = {
        id: faker.string.uuid(),
        catalog_item_id: faker.string.uuid(),
        tax: faker.number.float(),
        tax_type: faker.helpers.enumValue(TaxTypes),
        tenant_id: faker.string.uuid(),
      };

      commission_repository_mock.getCommissionById.mockResolvedValueOnce(
        new Commission(commission_obj)
      );

      const commission_id = faker.string.uuid();

      const [data, error] = await company_service.getCommission({ commission_id });

      expect(error).toBeUndefined();
      expect(data).toEqual(commission_obj);
    });

    it("returns a not found error if commission doesn't exist", async () => {
      commission_repository_mock.getCommissionById.mockResolvedValueOnce(null);

      const commission_id = faker.string.uuid();

      const [data, error] = await company_service.getCommission({ commission_id });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.commission');
    });
  });
});