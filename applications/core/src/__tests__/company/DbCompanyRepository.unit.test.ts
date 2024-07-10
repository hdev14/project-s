import Company from "@company/domain/Company";
import DbCompanyRepository from "@company/infra/DbCompanyRepository";
import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/infra/Database";

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
  });
});