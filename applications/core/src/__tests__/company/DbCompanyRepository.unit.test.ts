import Company from "@company/domain/Company";
import DbCompanyRepository from "@company/infra/DbCompanyRepository";
import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/infra/Database";
import { PageOptions } from "@shared/utils/Pagination";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbCompanyRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbCompanyRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  describe('DbCompanyRepository.getCompanies', () => {
    it('returns a list of companies', async () => {
      const companies = [
        {
          id: faker.string.uuid(),
          document: faker.string.numeric(14),
          name: faker.company.name(),
          street: faker.location.street(),
          district: faker.location.street(),
          state: faker.location.state(),
          number: faker.location.buildingNumber(),
          complement: faker.string.sample(),
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
          color: faker.color.rgb(),
          logo_url: faker.internet.url(),
          access_plan_id: faker.string.uuid(),
        },
        {
          id: faker.string.uuid(),
          document: faker.string.numeric(14),
          name: faker.company.name(),
          street: faker.location.street(),
          district: faker.location.street(),
          state: faker.location.state(),
          number: faker.location.buildingNumber(),
          complement: faker.string.sample(),
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
          color: faker.color.rgb(),
          logo_url: faker.internet.url(),
          access_plan_id: faker.string.uuid(),
        },
      ];

      const employees = [
        {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          document: faker.string.numeric(11),
          email: faker.internet.email(),
          tenant_id: companies[0].id,
        },
        {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          document: faker.string.numeric(11),
          email: faker.internet.email(),
          tenant_id: companies[0].id,
        },
        {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          document: faker.string.numeric(11),
          email: faker.internet.email(),
          tenant_id: companies[1].id,
        },
      ];

      query_mock
        .mockResolvedValueOnce({ rows: companies })
        .mockResolvedValueOnce({ rows: employees });

      const { results, page_result } = await repository.getCompanies();

      expect(results[0]).toBeInstanceOf(Company);
      expect(results).toHaveLength(2);
      expect(results[0].toObject().employees).toHaveLength(2);
      expect(results[1].toObject().employees).toHaveLength(1);
      expect(page_result).toBeUndefined();
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT * FROM users WHERE tenant_id IS NULL AND is_admin = false'
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM users WHERE tenant_id IN ($1,$2)',
        [companies[0].id, companies[1].id]
      );
    });

    it('returns a list of companies when the limit of pagination is 1 and the page is 1', async () => {
      const companies = [
        {
          id: faker.string.uuid(),
          document: faker.string.numeric(14),
          name: faker.company.name(),
          street: faker.location.street(),
          district: faker.location.street(),
          state: faker.location.state(),
          number: faker.location.buildingNumber(),
          complement: faker.string.sample(),
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
          color: faker.color.rgb(),
          logo_url: faker.internet.url(),
          access_plan_id: faker.string.uuid(),
        },
      ];

      const employees = [
        {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          document: faker.string.numeric(11),
          email: faker.internet.email(),
          tenant_id: companies[0].id,
        },
        {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          document: faker.string.numeric(11),
          email: faker.internet.email(),
          tenant_id: companies[0].id,
        },
      ];

      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({ rows: companies })
        .mockResolvedValueOnce({ rows: employees });

      const page_options: PageOptions = {
        limit: 1,
        page: 1,
      };

      const { results, page_result } = await repository.getCompanies({ page_options });

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(Company);
      expect(results[0].toObject().employees).toHaveLength(2);
      expect(page_result!.next_page).toEqual(2);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT count(id) as total FROM users WHERE tenant_id IS NULL AND is_admin = false',
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM users WHERE tenant_id IS NULL AND is_admin = false LIMIT $1 OFFSET $2',
        [page_options.limit, 0],
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        3,
        'SELECT * FROM users WHERE tenant_id IN ($1)',
        [companies[0].id]
      );
    });

    it('returns a list of companies when the limit of pagination is 1 and the page is 2', async () => {
      const companies = [
        {
          id: faker.string.uuid(),
          document: faker.string.numeric(14),
          name: faker.company.name(),
          street: faker.location.street(),
          district: faker.location.street(),
          state: faker.location.state(),
          number: faker.location.buildingNumber(),
          complement: faker.string.sample(),
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
          color: faker.color.rgb(),
          logo_url: faker.internet.url(),
          access_plan_id: faker.string.uuid(),
        },
      ];

      const employees = [
        {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          document: faker.string.numeric(11),
          email: faker.internet.email(),
          tenant_id: companies[0].id,
        },
        {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          document: faker.string.numeric(11),
          email: faker.internet.email(),
          tenant_id: companies[0].id,
        },
      ];

      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({ rows: companies })
        .mockResolvedValueOnce({ rows: employees });

      const page_options: PageOptions = {
        limit: 1,
        page: 2,
      };

      const { results, page_result } = await repository.getCompanies({ page_options });

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(Company);
      expect(results[0].toObject().employees).toHaveLength(2);
      expect(page_result!.next_page).toEqual(-1);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT count(id) as total FROM users WHERE tenant_id IS NULL AND is_admin = false',
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM users WHERE tenant_id IS NULL AND is_admin = false LIMIT $1 OFFSET $2',
        [page_options.limit, 1],
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        3,
        'SELECT * FROM users WHERE tenant_id IN ($1)',
        [companies[0].id]
      );
    });
  });

  describe('DbCompanyRepository.updateCompany', () => {
    it("updates a company", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const company_obj = {
        id: faker.string.uuid(),
        document: faker.string.numeric(14),
        name: faker.company.name(),
        access_plan_id: faker.string.uuid(),
        address: {
          street: faker.location.street(),
          district: faker.location.street(),
          state: faker.location.state(),
          number: faker.location.buildingNumber(),
          complement: faker.string.sample(),
        },
        bank: {
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
        },
        brand: {
          color: faker.color.rgb(),
          logo_url: faker.internet.url(),
        },
        employees: [],
      };

      const company = new Company(company_obj);

      await repository.updateCompany(company);

      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE users SET document=$2,name=$3,access_plan_id=$4,street=$5,district=$6,state=$7,number=$8,complement=$9,account=$10,account_digit=$11,agency=$12,agency_digit=$13,bank_code=$14,color=$15,logo_url=$16 WHERE id = $1',
        [
          company_obj.document,
          company_obj.name,
          company_obj.access_plan_id,
          company_obj.address.street,
          company_obj.address.district,
          company_obj.address.state,
          company_obj.address.number,
          company_obj.address.complement,
          company_obj.bank.account,
          company_obj.bank.account_digit,
          company_obj.bank.agency,
          company_obj.bank.agency_digit,
          company_obj.bank.bank_code,
          company_obj.brand.color,
          company_obj.brand.logo_url,
        ],
      );
    });
  });

  describe('DbCompanyRepository.getCompanyById', () => {
    it('returns a company by id', async () => {
      const companies = [
        {
          id: faker.string.uuid(),
          document: faker.string.numeric(14),
          name: faker.company.name(),
          street: faker.location.street(),
          district: faker.location.street(),
          state: faker.location.state(),
          number: faker.location.buildingNumber(),
          complement: faker.string.sample(),
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
          color: faker.color.rgb(),
          logo_url: faker.internet.url(),
          access_plan_id: faker.string.uuid(),
        },
      ];

      const employees = [
        {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          document: faker.string.numeric(11),
          email: faker.internet.email(),
          tenant_id: companies[0].id,
        },
        {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          document: faker.string.numeric(11),
          email: faker.internet.email(),
          tenant_id: companies[0].id,
        },
      ];

      query_mock
        .mockResolvedValueOnce({ rows: companies })
        .mockResolvedValueOnce({ rows: employees });

      const company = await repository.getCompanyById(companies[0].id);

      expect(company).toBeInstanceOf(Company);
      expect(company!.toObject().employees).toHaveLength(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT * FROM users WHERE tenant_id IS NULL AND is_admin = false AND id = $1',
        [companies[0].id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM users WHERE tenant_id = $1',
        [companies[0].id]
      );
    });

    it("returns NULL if company doesn't exist", async () => {
      query_mock.mockResolvedValueOnce({
        rows: []
      });

      const company_id = faker.string.uuid();
      const company = await repository.getCompanyById(company_id);

      expect(company).toBeNull()
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE tenant_id IS NULL AND is_admin = false AND id = $1',
        [company_id]
      );
    });
  });
});