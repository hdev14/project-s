import CatalogRepository from "@catalog/app/CatalogRepository";
import GetCatalogItemCommandHandler from "@catalog/app/GetCatalogItemCommandHandler";
import CatalogItem from "@catalog/domain/CatalogItem";
import { faker } from '@faker-js/faker/locale/pt_BR';
import GetCatalogItemCommand from "@shared/commands/GetCatalogItemCommand";
import NotFoundError from "@shared/errors/NotFoundError";
import { mock } from 'jest-mock-extended';

describe('GetCatalogItemCommandHandler unit tests', () => {
  const catalog_repository_mock = mock<CatalogRepository>();
  const handler = new GetCatalogItemCommandHandler(catalog_repository_mock);

  it("throws a not found error if catalog item doesn't exist", async () => {
    catalog_repository_mock.getCatalogItemById.mockResolvedValueOnce(null);
    try {
      await handler.handle(new GetCatalogItemCommand(faker.string.uuid()))
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundError);
    }
  });

  it("returns the catalog item's amount", async () => {
    const catalog_item = new CatalogItem({
      tenant_id: faker.string.uuid(),
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      amount: faker.number.float(),
      attributes: [{ name: faker.word.noun(), description: faker.lorem.lines() }],
      is_service: faker.datatype.boolean(),
      picture_url: faker.internet.url(),
    });

    catalog_repository_mock.getCatalogItemById.mockResolvedValueOnce(catalog_item);

    const result = await handler.handle(new GetCatalogItemCommand(faker.string.uuid()))

    expect(result).toEqual(catalog_item.toObject());
  });
});