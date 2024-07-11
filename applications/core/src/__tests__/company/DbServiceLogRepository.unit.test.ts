import { TaxTypes } from "@company/domain/Commission";
import ServiceLog from "@company/domain/ServiceLog";
import DbServiceLogRepository from "@company/infra/DbServiceLogRepository";
import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/infra/Database";
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
              c_id: faker.string.uuid()
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
              c_id: faker.string.uuid()
            }
          ]
        });

      const tenant_id = faker.string.uuid();

      const { results, page_result } = await repository.getServiceLogs({ tenant_id });

      expect(results[0]).toBeInstanceOf(ServiceLog);
      expect(results).toHaveLength(2);
      expect(page_result).toBeUndefined();
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT *, c.id as c_id FROM service_logs sl JOIN commissions c ON sl.commission_id = c.id WHERE sl.tenant_id = $1',
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
              c_id: faker.string.uuid()
            }
          ]
        });

      const tenant_id = faker.string.uuid();
      const page_options: PageOptions = {
        limit: 1,
        page: 1,
      };

      const { results, page_result } = await repository.getServiceLogs({ tenant_id, page_options });

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(ServiceLog);
      expect(page_result!.next_page).toEqual(2);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT count(id) as total FROM service_logs WHERE tenant_id = $1',
        [tenant_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT *, c.id as c_id FROM service_logs sl JOIN commissions c ON sl.commission_id = c.id WHERE sl.tenant_id = $1 LIMIT $2 OFFSET $3',
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
              c_id: faker.string.uuid()
            },
          ]
        });

      const tenant_id = faker.string.uuid();
      const page_options: PageOptions = {
        limit: 1,
        page: 2,
      };

      const { results, page_result } = await repository.getServiceLogs({ tenant_id, page_options });

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(ServiceLog);
      expect(page_result!.next_page).toEqual(-1);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT count(id) as total FROM service_logs WHERE tenant_id = $1',
        [tenant_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT *, c.id as c_id FROM service_logs sl JOIN commissions c ON sl.commission_id = c.id WHERE sl.tenant_id = $1 LIMIT $2 OFFSET $3',
        [tenant_id, page_options.limit, 1],
      );
    });
  });
});