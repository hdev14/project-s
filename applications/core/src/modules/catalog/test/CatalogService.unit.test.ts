import CatalogRepository from '@catalog/app/CatalogRepository';
import CatalogService from '@catalog/app/CatalogService';
import CatalogItem from '@catalog/domain/CatalogItem';
import { faker } from '@faker-js/faker/locale/pt_BR';
import UserExistsCommand from '@shared/commands/UserExistsCommand';
import DomainError from '@shared/errors/DomainError';
import NotFoundError from '@shared/errors/NotFoundError';
import Mediator from '@shared/Mediator';
import { mock } from 'jest-mock-extended';

describe('CatalogService unit tests', () => {
  const catalog_repository_mock = mock<CatalogRepository>();
  const mediator_mock = mock<Mediator>();
  const catalog_service = new CatalogService(catalog_repository_mock, mediator_mock);

  describe('CatalogService.getCatalogItems', () => {
    it('returns a list of catalog items', async () => {
      catalog_repository_mock.getCatalogItems.mockResolvedValueOnce({
        results: [
          {
            id: faker.string.uuid(),
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            amount: faker.number.float(),
            attributes: [{ name: faker.word.adjective(), description: faker.lorem.lines() }],
            is_service: faker.datatype.boolean(),
            picture_url: faker.internet.url(),
            tenant_id: faker.string.uuid()
          },
          {
            id: faker.string.uuid(),
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            amount: faker.number.float(),
            attributes: [{ name: faker.word.adjective(), description: faker.lorem.lines() }],
            is_service: faker.datatype.boolean(),
            picture_url: faker.internet.url(),
            tenant_id: faker.string.uuid(),
          },
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
    it('creates a new catalog item', async () => {
      mediator_mock.send.mockResolvedValueOnce(true);

      const params = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        tenant_id: faker.string.uuid(),
      };

      const [data, error] = await catalog_service.createCatalogItem(params);

      expect(error).toBeUndefined();
      expect(data!.id).toBeDefined();
      expect(data!.description).toBe(params.description);
      expect(data!.attributes[0].name).toBe(params.attributes[0].name);
      expect(data!.attributes[0].description).toBe(params.attributes[0].description);
      expect(data!.is_service).toBe(params.is_service);
      expect(data!.picture_url).toBeUndefined();
      expect(data!.tenant_id).toEqual(params.tenant_id);
      expect(catalog_repository_mock.createCatalogItem).toHaveBeenCalled();
    });

    it("results a not found error if tenant doesn't exist", async () => {
      mediator_mock.send.mockResolvedValueOnce(false);

      const params = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        tenant_id: faker.string.uuid(),
      };

      const [data, error] = await catalog_service.createCatalogItem(params);

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(mediator_mock.send).toHaveBeenCalledTimes(1);
      expect(mediator_mock.send.mock.calls[0][0]).toBeInstanceOf(UserExistsCommand);
    });

    it("results a domain error if amount is negative", async () => {
      mediator_mock.send.mockResolvedValueOnce(true);

      const params = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        amount: faker.number.float() * -1,
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        tenant_id: faker.string.uuid(),
      };

      const [data, error] = await catalog_service.createCatalogItem(params);

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(DomainError);
    });
  });

  describe('CatalogService.updateCatalogItem', () => {
    it("should return a not found error if catalog item doesn't exist", async () => {
      catalog_repository_mock.getCatalogItemById.mockResolvedValueOnce(null);

      const params = {
        catalog_item_id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        tenant_id: faker.string.uuid(),
      };

      const [, error] = await catalog_service.updateCatalogItem(params);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.catalog_item');
    });

    it("should update a catalog item", async () => {
      catalog_repository_mock.getCatalogItemById.mockResolvedValueOnce(
        new CatalogItem({
          id: faker.string.uuid(),
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          amount: faker.number.float(),
          attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
          is_service: faker.datatype.boolean(),
          tenant_id: faker.string.uuid(),
          picture_url: faker.internet.url(),
        })
      );

      const params = {
        catalog_item_id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        tenant_id: faker.string.uuid(),
        picture_url: faker.internet.url(),
      };

      const [, error] = await catalog_service.updateCatalogItem(params);

      expect(error).toBeUndefined();
      expect(catalog_repository_mock.updateCatalogItem).toHaveBeenCalledTimes(1);
      const param = catalog_repository_mock.updateCatalogItem.mock.calls[0][0].toObject();
      expect(param.name).toEqual(params.name);
      expect(param.description).toEqual(params.description);
      expect(param.attributes[0].name).toEqual(params.attributes[0].name);
      expect(param.attributes[0].description).toEqual(params.attributes[0].description);
      expect(param.picture_url).toEqual(params.picture_url);
    });
  });
});
