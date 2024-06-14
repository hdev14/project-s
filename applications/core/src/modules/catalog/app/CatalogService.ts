import { CatalogItemObject } from "@catalog/domain/CatalogItem";
import Either from "@share/utils/Either";

export default class CatalogService {
  async getCatalogItems(params: {}): Promise<Either<Array<CatalogItemObject>>> {
    return Either.left(new Error());
  }

  async createCatalogItem(params: {}): Promise<Either<CatalogItemObject>> {
    return Either.left(new Error());
  }

  async updateCatalogItem(params: {}): Promise<Either<CatalogItemObject>> {
    return Either.left(new Error());
  }

  async addNewAttribute(params: {}): Promise<Either<void>> {
    return Either.left(new Error());
  }
}