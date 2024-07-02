import CatalogRepository from '@catalog/app/CatalogRepository';
import CatalogService from '@catalog/app/CatalogService';
import CatalogItem from '@catalog/domain/CatalogItem';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { mock } from 'jest-mock-extended';

describe('CatalogService unit tests', () => {
  const catalog_repository_mock = mock<CatalogRepository>();
  const catalog_service = new CatalogService(catalog_repository_mock);

  describe('CatalogService.getCatalogItems', () => {
    it('returns a list of catalog items', async () => {
      catalog_repository_mock.getCatalogItems.mockResolvedValueOnce({
        results: [
          new CatalogItem({
            id: faker.string.uuid(),
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            attributes: [{ name: faker.word.adjective(), description: faker.lorem.lines() }],
            is_service: faker.datatype.boolean(),
            picture_url: faker.internet.url(),
          }),
          new CatalogItem({
            id: faker.string.uuid(),
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            attributes: [{ name: faker.word.adjective(), description: faker.lorem.lines() }],
            is_service: faker.datatype.boolean(),
            picture_url: faker.internet.url(),
          }),
        ],
        page_result: {
          next_page: 2,
          total_of_pages: 2,
        }
      });

      const [data, error] = await catalog_service.getCatalogItems({});

      expect(error).toBeUndefined();
      expect(data!.results[0]).not.toBeInstanceOf(CatalogItem);
      expect(data!.results).toHaveLength(2);
      expect(data!.page_result).toEqual({
        next_page: 2,
        total_of_pages: 2
      });
    });
  });

  describe('CatalogService.createCatalogItem', () => {
    it('create a new catalog item', async () => {
      const params = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
      };

      const [data, error] = await catalog_service.createCatalogItem(params);

      expect(error).toBeUndefined();
      expect(data!.id).toBeDefined();
      expect(data!.description).toBe(params.description);
      expect(data!.attributes[0].name).toBe(params.attributes[0].name);
      expect(data!.attributes[0].description).toBe(params.attributes[0].description);
      expect(data!.is_service).toBe(params.is_service);
      expect(data!.picture_url).toBeUndefined();
      expect(catalog_repository_mock.createCatalogItem).toHaveBeenCalled();
    });

    it.todo("results a not found error if tenant doesn't exist");
  });
});