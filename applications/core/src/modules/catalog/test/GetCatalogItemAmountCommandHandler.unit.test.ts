import GetCatalogItemAmountCommandHandler from "@catalog/app/GetCatalogItemAmountCommandHandler";
import { faker } from '@faker-js/faker/locale/pt_BR';
import GetCatalogItemAmountCommand from "@shared/commands/GetCatalogItemAmountCommand";
import { NotBeforeError } from "jsonwebtoken";
import { mock } from 'jest-mock-extended';
import CatalogRepository from "@catalog/app/CatalogRepository";
import CatalogItem from "@catalog/domain/CatalogItem";
import NotFoundError from "@shared/errors/NotFoundError";

describe('GetCatalogItemAmountCommandHandler unit tests', () => {
  const catalog_repository_mock = mock<CatalogRepository>();
  const handler = new GetCatalogItemAmountCommandHandler(catalog_repository_mock);

  it("throws a not found error if catalog item doesn't exist", async () => {
    catalog_repository_mock.getCatalogItemById.mockResolvedValueOnce(null);
    try {
      await handler.handle(new GetCatalogItemAmountCommand(faker.string.uuid()))
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundError);
    }
  });

  it("returns the catalog item's amount", async () => {
    const amount = faker.number.float();

    catalog_repository_mock.getCatalogItemById.mockResolvedValueOnce(
      new CatalogItem({
        tenant_id: faker.string.uuid(),
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        amount,
        attributes: [{ name: faker.word.noun(), description: faker.lorem.lines() }],
        is_service: faker.datatype.boolean(),
        picture_url: faker.internet.url(),
      })
    );

    const result = await handler.handle(new GetCatalogItemAmountCommand(faker.string.uuid()))

    expect(result).toEqual(amount);
  });
});