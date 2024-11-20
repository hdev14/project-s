import { faker } from "@faker-js/faker";
import PaymentLog from "@payment/domain/PaymentLog";
import DbPaymentLogRepository from "@payment/infra/persistence/DbPaymentLogRepository";
import Database from "@shared/Database";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbPaymentLogRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbPaymentLogRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  describe('DbPaymentLogRepository.createPaymentLog', () => {
    it('should create a new payment log', async () => {
      const payment_log_props = {
        id: faker.string.uuid(),
        external_id: faker.string.uuid(),
        payload: JSON.stringify({ test: faker.string.sample() }),
        payment_id: faker.string.uuid(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      const payment_log = new PaymentLog(payment_log_props);

      await repository.createPaymentLog(payment_log)

      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO payment_logs (id,external_id,payment_id,payload,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6)',
        [
          payment_log_props.id,
          payment_log_props.external_id,
          payment_log_props.payment_id,
          payment_log_props.payload,
          payment_log_props.created_at,
          payment_log_props.updated_at,
        ]
      );
    });
  });

  describe('DbPaymentLogRepository.getPaymentLogs', () => {
    it("returns a list of payment's logs", async () => {
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: faker.string.uuid(),
            external_id: faker.string.uuid(),
            payload: JSON.stringify({ test: faker.string.sample() }),
            payment_id: faker.string.uuid(),
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: faker.string.uuid(),
            external_id: faker.string.uuid(),
            payload: JSON.stringify({ test: faker.string.sample() }),
            payment_id: faker.string.uuid(),
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: faker.string.uuid(),
            external_id: faker.string.uuid(),
            payload: JSON.stringify({ test: faker.string.sample() }),
            payment_id: faker.string.uuid(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]
      });

      const filter = {
        payment_id: faker.string.uuid(),
      };

      const { results, page_result } = await repository.getPaymentLogs(filter);

      expect(results).toHaveLength(3);
      expect(page_result).toBeUndefined();
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM payment_logs WHERE payment_id=$1',
        [filter.payment_id],
      );
    });

    it("returns a list of payment's logs paginated when the limit of pagination is 1 and the page is 1", async () => {
      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: faker.string.uuid(),
              external_id: faker.string.uuid(),
              payload: JSON.stringify({ test: faker.string.sample() }),
              payment_id: faker.string.uuid(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          ]
        });

      const filter = {
        payment_id: faker.string.uuid(),
        page_options: {
          limit: 1,
          page: 1,
        }
      };

      const { results, page_result } = await repository.getPaymentLogs(filter);

      expect(results).toHaveLength(1);
      expect(page_result!.next_page).toEqual(2);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT COUNT(id) as total FROM payment_logs WHERE payment_id=$1',
        [filter.payment_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM payment_logs WHERE payment_id=$1 LIMIT $2 OFFSET $3',
        [filter.payment_id, filter.page_options.limit, 0],
      );
    });
  });
});
