import CatalogItem from "@catalog/domain/CatalogItem";
import DbCatalogRepository from "@catalog/infra/DbCatalogRepository";
import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/infra/Database";
import { PageOptions } from "@shared/utils/Pagination";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbCatalogRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbCatalogRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  describe('DbCatalogRepository.getCatalogItems', () => {
    it('returns a list of catalog items', async () => {
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: faker.string.uuid(),
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            attributes: JSON.stringify([
              {
                name: faker.commerce.productAdjective(),
                description: faker.lorem.lines()
              }
            ]),
            is_service: faker.datatype.boolean(),
            picture_url: faker.internet.url(),
          },
          {
            id: faker.string.uuid(),
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            attributes: JSON.stringify([
              {
                name: faker.commerce.productAdjective(),
                description: faker.lorem.lines()
              }
            ]),
            is_service: faker.datatype.boolean(),
            picture_url: faker.internet.url(),
          },
          {
            id: faker.string.uuid(),
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            attributes: JSON.stringify([
              {
                name: faker.commerce.productAdjective(),
                description: faker.lorem.lines()
              }
            ]),
            is_service: faker.datatype.boolean(),
            picture_url: faker.internet.url(),
          },
        ]
      });

      const { results } = await repository.getCatalogItems();

      expect(results[0]).toBeInstanceOf(CatalogItem);
      expect(results).toHaveLength(3);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM catalog_items WHERE deleted_at IS NULL',
      );
    });

    it('returns a list of catalog items when the limit of pagination is 1 and the page is 1', async () => {
      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: faker.string.uuid(),
              name: faker.commerce.productName(),
              description: faker.commerce.productDescription(),
              attributes: JSON.stringify([
                {
                  name: faker.commerce.productAdjective(),
                  description: faker.lorem.lines()
                }
              ]),
              is_service: faker.datatype.boolean(),
              picture_url: faker.internet.url(),
            },
          ]
        });

      const pagination_options: PageOptions = {
        limit: 1,
        page: 1,
      };

      const { results, page_result } = await repository.getCatalogItems(pagination_options);

      expect(results[0]).toBeInstanceOf(CatalogItem);
      expect(results).toHaveLength(1);
      expect(page_result!.next_page).toEqual(2);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT count(id) as total FROM catalog_items WHERE deleted_at IS NULL',
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM catalog_items WHERE deleted_at IS NULL LIMIT $1 OFFSET $2',
        [pagination_options.limit, 0],
      );
    });

    it('returns a list of catalog items when the limit of pagination is 1 and the page is 2', async () => {
      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: faker.string.uuid(),
              name: faker.commerce.productName(),
              description: faker.commerce.productDescription(),
              attributes: JSON.stringify([
                {
                  name: faker.commerce.productAdjective(),
                  description: faker.lorem.lines()
                }
              ]),
              is_service: faker.datatype.boolean(),
              picture_url: faker.internet.url(),
            },
          ]
        });

      const pagination_options: PageOptions = {
        limit: 1,
        page: 2,
      };

      const { results, page_result } = await repository.getCatalogItems(pagination_options);

      expect(results[0]).toBeInstanceOf(CatalogItem);
      expect(results).toHaveLength(1);
      expect(page_result!.next_page).toEqual(-1);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT count(id) as total FROM catalog_items WHERE deleted_at IS NULL',
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM catalog_items WHERE deleted_at IS NULL LIMIT $1 OFFSET $2',
        [pagination_options.limit, 1],
      );
    });
  });

  describe('DbCatalogRepository.createCatalogItem', () => {
    it('should create a new catalog_item', async () => {
      const catalog_item_obj = {
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [{ name: faker.word.noun(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        picture_url: faker.internet.url(),
      };

      const catalog_item = new CatalogItem(catalog_item_obj);

      await repository.createCatalogItem(catalog_item);

      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO catalog_items (id,name,description,attributes,is_service,picture_url) VALUES ($1,$2,$3,$4,$5,$6)',
        [catalog_item_obj.id, catalog_item_obj.name, catalog_item_obj.description, JSON.stringify(catalog_item_obj.attributes), catalog_item_obj.is_service, catalog_item_obj.picture_url]
      );
    });

    it('should create a new catalog_item without picture_url', async () => {
      const catalog_item_obj = {
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [{ name: faker.word.noun(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
      };

      const catalog_item = new CatalogItem(catalog_item_obj);

      await repository.createCatalogItem(catalog_item);

      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO catalog_items (id,name,description,attributes,is_service) VALUES ($1,$2,$3,$4,$5)',
        [catalog_item_obj.id, catalog_item_obj.name, catalog_item_obj.description, JSON.stringify(catalog_item_obj.attributes), catalog_item_obj.is_service]
      );
    });
  });

  describe('DbCatalogRepository.updateCatalogItem', () => {
    it('should update a catalog_item', async () => {
      const catalog_item_obj = {
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [{ name: faker.word.noun(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        picture_url: faker.internet.url(),
      };

      const catalog_item = new CatalogItem(catalog_item_obj);

      await repository.updateCatalogItem(catalog_item);

      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE catalog_items SET name=$2,description=$3,attributes=$4,is_service=$5,picture_url=$6 WHERE id=$1',
        [catalog_item_obj.id, catalog_item_obj.name, catalog_item_obj.description, JSON.stringify(catalog_item_obj.attributes), catalog_item_obj.is_service, catalog_item_obj.picture_url]
      );
    });

    it('should update a catalog_item without picture_url', async () => {
      const catalog_item_obj = {
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [{ name: faker.word.noun(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
      };

      const catalog_item = new CatalogItem(catalog_item_obj);

      await repository.updateCatalogItem(catalog_item);

      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE catalog_items SET name=$2,description=$3,attributes=$4,is_service=$5 WHERE id=$1',
        [catalog_item_obj.id, catalog_item_obj.name, catalog_item_obj.description, JSON.stringify(catalog_item_obj.attributes), catalog_item_obj.is_service]
      );
    });
  });
});