import { TaxTypes } from "@company/domain/Commission";
import ServiceLog from "@company/domain/ServiceLog";
import DbServiceLogRepository from "@company/infra/persistence/DbServiceLogRepository";
import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/Database";
import { PageOptions } from "@shared/utils/Pagination";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbServiceLogRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbServiceLogRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  describe('DbServiceLogRepository.getServiceLogs', () => {
    it('returns a list of service logs', async () => {
      query_mock
        .mockResolvedValueOnce({
          rows: [
            {
              id: faker.string.uuid(),
              catalog_item_id: faker.string.uuid(),
              tax: faker.number.float(),
              tax_type: faker.helpers.enumValue(TaxTypes),
              customer_id: faker.string.uuid(),
              tenant_id: faker.string.uuid(),
              paid_amount: faker.number.float(),
              registed_at: faker.date.anytime(),
              c_id: faker.string.uuid(),
              commission_amount: faker.number.float(),
              employee_id: faker.string.uuid(),
              service_id: faker.string.uuid(),
            },
            {
              id: faker.string.uuid(),
              catalog_item_id: faker.string.uuid(),
              tax: faker.number.float(),
              tax_type: faker.helpers.enumValue(TaxTypes),
              customer_id: faker.string.uuid(),
              tenant_id: faker.string.uuid(),
              paid_amount: faker.number.float(),
              registed_at: faker.date.anytime(),
              c_id: faker.string.uuid(),
              commission_amount: faker.number.float(),
              employee_id: faker.string.uuid(),
              service_id: faker.string.uuid(),
            },
          ]
        });

      const tenant_id = faker.string.uuid();

      const page = await repository.getServiceLogs({ tenant_id });

      expect(page.result).toHaveLength(2);
      expect(page.page_result).toBeUndefined();
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM service_logs WHERE tenant_id = $1',
        [tenant_id]
      );
    });

    it('returns a list of service logs when the limit of pagination is 1 and the page is 1', async () => {
      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: faker.string.uuid(),
              catalog_item_id: faker.string.uuid(),
              tax: faker.number.float(),
              tax_type: faker.helpers.enumValue(TaxTypes),
              customer_id: faker.string.uuid(),
              tenant_id: faker.string.uuid(),
              paid_amount: faker.number.float(),
              registed_at: faker.date.anytime(),
              c_id: faker.string.uuid(),
              commission_amount: faker.number.float(),
              employee_id: faker.string.uuid(),
              service_id: faker.string.uuid(),
            },
          ]
        });

      const tenant_id = faker.string.uuid();
      const page_options: PageOptions = {
        limit: 1,
        page: 1,
      };

      const page = await repository.getServiceLogs({ tenant_id, page_options });

      expect(page.result).toHaveLength(1);
      expect(page.page_result!.next_page).toEqual(2);
      expect(page.page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT count(id) as total FROM service_logs WHERE tenant_id = $1',
        [tenant_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM service_logs WHERE tenant_id = $1 LIMIT $2 OFFSET $3',
        [tenant_id, page_options.limit, 0],
      );
    });

    it('returns a list of service logs when the limit of pagination is 1 and the page is 2', async () => {
      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: faker.string.uuid(),
              catalog_item_id: faker.string.uuid(),
              tax: faker.number.float(),
              tax_type: faker.helpers.enumValue(TaxTypes),
              customer_id: faker.string.uuid(),
              tenant_id: faker.string.uuid(),
              paid_amount: faker.number.float(),
              registed_at: faker.date.anytime(),
              c_id: faker.string.uuid(),
              commission_amount: faker.number.float(),
              employee_id: faker.string.uuid(),
              service_id: faker.string.uuid(),
            },
          ]
        });

      const tenant_id = faker.string.uuid();
      const page_options: PageOptions = {
        limit: 1,
        page: 2,
      };

      const page = await repository.getServiceLogs({ tenant_id, page_options });

      expect(page.result).toHaveLength(1);
      expect(page.page_result!.next_page).toEqual(-1);
      expect(page.page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT count(id) as total FROM service_logs WHERE tenant_id = $1',
        [tenant_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM service_logs WHERE tenant_id = $1 LIMIT $2 OFFSET $3',
        [tenant_id, page_options.limit, 1],
      );
    });
  });

  describe('DbServiceLogRepository.createServiceLog', () => {
    it('creates a service log', async () => {
      query_mock
        .mockResolvedValueOnce({});

      const service_log = new ServiceLog({
        id: faker.string.uuid(),
        customer_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
        paid_amount: faker.number.float(),
        registed_at: faker.date.anytime(),
        commission_amount: faker.number.float(),
        employee_id: faker.string.uuid(),
        service_id: faker.string.uuid(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      });

      const service_log_obj = service_log.toObject();

      await repository.createServiceLog(service_log);

      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO service_logs (id,commission_amount,employee_id,service_id,customer_id,tenant_id,paid_amount,registed_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [
          service_log_obj.id,
          service_log_obj.commission_amount,
          service_log_obj.employee_id,
          service_log_obj.service_id,
          service_log_obj.customer_id,
          service_log_obj.tenant_id,
          service_log_obj.paid_amount,
          service_log_obj.registed_at,
          service_log_obj.created_at,
          service_log_obj.updated_at,
        ],
      );
    });
  });
});
