import { CatalogItemObject } from "@catalog/domain/CatalogItem";
import Either from "@shared/utils/Either";
import CatalogRepository from "./CatalogRepository";

export default class CatalogService {
  #catalog_repository: CatalogRepository;

  constructor(catalog_repository: CatalogRepository) {
    this.#catalog_repository = catalog_repository;
  }

  async getCatalogItems(params: {}): Promise<Either<Array<CatalogItemObject>>> {
    return Either.left(new Error());
  }

  async createCatalogItem(params: {}): Promise<Either<CatalogItemObject>> {
    return Either.left(new Error());
  }

  async updateCatalogItem(params: {}): Promise<Either<CatalogItemObject>> {
    return Either.left(new Error());
  }

  async updatePicture(params: {}): Promise<Either<void>> {
    return Either.left(new Error());
  }
}