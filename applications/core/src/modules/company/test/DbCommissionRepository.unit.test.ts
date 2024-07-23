import Commission, { TaxTypes } from "@company/domain/Commission";
import DbCommissionRepository from "@company/infra/DbCommissionRepository";
import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/infra/Database";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbCommissionRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbCommissionRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  describe('DbCommissionRepository.updateCommission', () => {
    it("updates a commission", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const commission_obj = {
        id: faker.string.uuid(),
        catalog_item_id: faker.string.uuid(),
        tax: faker.number.float(),
        tax_type: faker.helpers.enumValue(TaxTypes),
        tenant_id: faker.string.uuid(),
      };

      const commission = new Commission(commission_obj);

      await repository.updateCommission(commission);

      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE commissions SET catalog_item_id=$2,tax=$3,tax_type=$4,tenant_id=$5 WHERE id = $1',
        [
          commission_obj.id,
          commission_obj.catalog_item_id,
          commission_obj.tax,
          commission_obj.tax_type,
          commission_obj.tenant_id,
        ],
      );
    });
  });

  describe('DbCommissionRepository.getCommissionById', () => {
    it('returns a commission by id', async () => {
      query_mock
        .mockResolvedValueOnce({
          rows: [{
            id: faker.string.uuid(),
            catalog_item_id: faker.string.uuid(),
            tax: faker.number.float(),
            tax_type: faker.helpers.enumValue(TaxTypes),
            tenant_id: faker.string.uuid(),
          }]
        });

      const commission_id = faker.string.uuid();
      const commission = await repository.getCommissionById(commission_id);

      expect(commission).toBeInstanceOf(Commission);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM commissions WHERE id = $1',
        [commission_id]
      );
    });

    it("returns NULL if commission doesn't exist", async () => {
      query_mock
        .mockResolvedValueOnce({ rows: [] });

      const commission_id = faker.string.uuid();
      const commission = await repository.getCommissionById(commission_id);

      expect(commission).toBeNull();
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM commissions WHERE id = $1',
        [commission_id]
      );
    });
  });

  describe('DbCommissionRepository.createCommission', () => {
    it('creates a service log', async () => {
      query_mock
        .mockResolvedValueOnce({});

      const commission_obj = {
        id: faker.string.uuid(),
        catalog_item_id: faker.string.uuid(),
        tax: faker.number.float(),
        tax_type: faker.helpers.enumValue(TaxTypes),
        tenant_id: faker.string.uuid(),
      };

      const commission = new Commission(commission_obj);

      await repository.createCommission(commission);

      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO commissions (id,catalog_item_id,tax,tax_type,tenant_id) VALUES ($1,$2,$3,$4,$5)',
        [
          commission_obj.id,
          commission_obj.catalog_item_id,
          commission_obj.tax,
          commission_obj.tax_type,
          commission_obj.tenant_id,
        ],
      );
    });
  });

  describe('DbCommissionRepository.getCommissionByCatalogItemId', () => {
    it('returns a commission by catalog item id', async () => {
      query_mock
        .mockResolvedValueOnce({
          rows: [{
            id: faker.string.uuid(),
            catalog_item_id: faker.string.uuid(),
            tax: faker.number.float(),
            tax_type: faker.helpers.enumValue(TaxTypes),
            tenant_id: faker.string.uuid(),
          }]
        });

      const catalog_item_id = faker.string.uuid();
      const commission = await repository.getCommissionByCatalogItemId(catalog_item_id);

      expect(commission).toBeInstanceOf(Commission);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM commissions WHERE catalog_item_id = $1',
        [catalog_item_id]
      );
    });

    it("returns NULL if commission doesn't exist", async () => {
      query_mock
        .mockResolvedValueOnce({ rows: [] });

      const catalog_item_id = faker.string.uuid();
      const commission = await repository.getCommissionByCatalogItemId(catalog_item_id);

      expect(commission).toBeNull();
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM commissions WHERE catalog_item_id = $1',
        [catalog_item_id]
      );
    });
  });
});