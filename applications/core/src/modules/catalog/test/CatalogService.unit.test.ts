import CatalogRepository from '@catalog/app/CatalogRepository';
import CatalogService from '@catalog/app/CatalogService';
import CatalogItem from '@catalog/domain/CatalogItem';
import { faker } from '@faker-js/faker/locale/pt_BR';
import FileStorage from '@global/app/FileStorage';
import GetUserCommand from '@shared/commands/GetUserCommand';
import DomainError from '@shared/errors/DomainError';
import NotFoundError from '@shared/errors/NotFoundError';
import Mediator from '@shared/Mediator';
import Page from '@shared/utils/Page';
import { mock } from 'jest-mock-extended';

describe('CatalogService unit tests', () => {
  const catalog_repository_mock = mock<CatalogRepository>();
  const mediator_mock = mock<Mediator>();
  const file_storage_mock = mock<FileStorage>();
  const catalog_service = new CatalogService(catalog_repository_mock, mediator_mock, file_storage_mock);

  describe('CatalogService.getCatalogItems', () => {
    it('returns a list of catalog items', async () => {
      catalog_repository_mock.getCatalogItems.mockResolvedValueOnce(
        new Page(
          [
            new CatalogItem({
              id: faker.string.uuid(),
              name: faker.commerce.productName(),
              description: faker.commerce.productDescription(),
              amount: faker.number.float(),
              attributes: [{ name: faker.word.adjective(), description: faker.lorem.lines() }],
              is_service: faker.datatype.boolean(),
              picture_url: faker.internet.url(),
              tenant_id: faker.string.uuid()
            }),
            new CatalogItem({
              id: faker.string.uuid(),
              name: faker.commerce.productName(),
              description: faker.commerce.productDescription(),
              amount: faker.number.float(),
              attributes: [{ name: faker.word.adjective(), description: faker.lorem.lines() }],
              is_service: faker.datatype.boolean(),
              picture_url: faker.internet.url(),
              tenant_id: faker.string.uuid(),
            }),
          ],
          {
            next_page: 2,
            total_of_pages: 2,
          }
        )
      );

      const [error, data] = await catalog_service.getCatalogItems({});

      expect(error).toBeUndefined();
      expect(data!.result[0]).not.toBeInstanceOf(CatalogItem);
      expect(data!.result).toHaveLength(2);
      expect(data!.page_result).toEqual({
        next_page: 2,
        total_of_pages: 2
      });
    });
  });

  describe('CatalogService.createCatalogItem', () => {
    it('creates a new catalog item', async () => {
      mediator_mock.send.mockResolvedValueOnce({ id: faker.string.uuid() });

      const params = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        tenant_id: faker.string.uuid(),
      };

      const [error, data] = await catalog_service.createCatalogItem(params);

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
      mediator_mock.send.mockResolvedValueOnce(null);

      const params = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        tenant_id: faker.string.uuid(),
      };

      const [error, data] = await catalog_service.createCatalogItem(params);

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(mediator_mock.send).toHaveBeenCalledTimes(1);
      expect(mediator_mock.send.mock.calls[0][0]).toBeInstanceOf(GetUserCommand);
    });

    it("results a domain error if amount is negative", async () => {
      mediator_mock.send.mockResolvedValueOnce({ id: faker.string.uuid() });

      const params = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        amount: faker.number.float() * -1,
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        tenant_id: faker.string.uuid(),
      };

      const [error, data] = await catalog_service.createCatalogItem(params);

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(DomainError);
    });

    it('creates a new catalog item with a picture', async () => {
      mediator_mock.send.mockResolvedValueOnce({ id: faker.string.uuid() });

      const params = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        tenant_id: faker.string.uuid(),
        picture_file: Buffer.from([]),
      };
      const picture_url = faker.internet.url();
      file_storage_mock.storeFile.mockResolvedValueOnce(picture_url);

      const [error, data] = await catalog_service.createCatalogItem(params);

      expect(error).toBeUndefined();
      expect(data!.id).toBeDefined();
      expect(data!.description).toBe(params.description);
      expect(data!.attributes[0].name).toBe(params.attributes[0].name);
      expect(data!.attributes[0].description).toBe(params.attributes[0].description);
      expect(data!.is_service).toBe(params.is_service);
      expect(data!.tenant_id).toEqual(params.tenant_id);
      expect(data!.picture_url).toEqual(picture_url);
      expect(catalog_repository_mock.createCatalogItem).toHaveBeenCalled();

      expect(catalog_repository_mock.createCatalogItem).toHaveBeenCalledTimes(1);
      const catalog_item = catalog_repository_mock.createCatalogItem.mock.calls[0][0];

      expect(file_storage_mock.storeFile).toHaveBeenCalledWith({
        bucket_name: `tenant-${params.tenant_id}`,
        folder: 'catalog_item_pictures',
        name: `picture_${catalog_item.id}`,
        file: params.picture_file,
      });
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

      const [error] = await catalog_service.updateCatalogItem(params);

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
      };

      const [error] = await catalog_service.updateCatalogItem(params);

      expect(error).toBeUndefined();
      expect(catalog_repository_mock.updateCatalogItem).toHaveBeenCalledTimes(1);
      const param = catalog_repository_mock.updateCatalogItem.mock.calls[0][0].toObject();
      expect(param.name).toEqual(params.name);
      expect(param.description).toEqual(params.description);
      expect(param.attributes[0].name).toEqual(params.attributes[0].name);
      expect(param.attributes[0].description).toEqual(params.attributes[0].description);
    });

    it('updates catalog item with a picture', async () => {
      const catalog_item = new CatalogItem({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        tenant_id: faker.string.uuid(),
        picture_url: faker.internet.url(),
      });

      catalog_repository_mock.getCatalogItemById.mockResolvedValueOnce(catalog_item);

      const params = {
        catalog_item_id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        picture_file: Buffer.from([]),
      };

      const picture_url = faker.internet.url();
      file_storage_mock.storeFile.mockResolvedValueOnce(picture_url);

      const [error] = await catalog_service.updateCatalogItem(params);

      expect(error).toBeUndefined();
      expect(catalog_repository_mock.updateCatalogItem).toHaveBeenCalledTimes(1);
      const param = catalog_repository_mock.updateCatalogItem.mock.calls[0][0].toObject();
      expect(param.name).toEqual(params.name);
      expect(param.description).toEqual(params.description);
      expect(param.attributes[0].name).toEqual(params.attributes[0].name);
      expect(param.attributes[0].description).toEqual(params.attributes[0].description);
      expect(param.picture_url).toEqual(picture_url);

      const obj = catalog_item.toObject();

      expect(catalog_repository_mock.updateCatalogItem).toHaveBeenCalledTimes(1);
      expect(file_storage_mock.storeFile).toHaveBeenCalledWith({
        bucket_name: `tenant-${obj.tenant_id}`,
        folder: 'catalog_item_pictures',
        name: `picture_${obj.id}`,
        file: params.picture_file,
      });
    });
  });
});
