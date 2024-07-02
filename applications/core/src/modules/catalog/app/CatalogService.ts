import { AttributeValue } from "@catalog/domain/Attribute";
import CatalogItem, { CatalogItemObject } from "@catalog/domain/CatalogItem";
import Either from "@shared/utils/Either";
import { PageOptions, PageResult } from "@shared/utils/Pagination";
import { randomUUID } from "crypto";
import CatalogRepository from "./CatalogRepository";

export type GetCatalogItemsParams = {
  tenant_id?: string;
  page_options?: PageOptions;
};

export type GetCatalogItemsResult = {
  results: Array<CatalogItemObject>;
  page_result?: PageResult;
};

export type CreateCatalogItemParams = {
  name: string;
  description: string;
  attributes: Array<AttributeValue>;
  is_service: boolean;
  picture_url?: string;
};

export default class CatalogService {
  #catalog_repository: CatalogRepository;

  constructor(catalog_repository: CatalogRepository) {
    this.#catalog_repository = catalog_repository;
  }

  async getCatalogItems(params: GetCatalogItemsParams): Promise<Either<GetCatalogItemsResult>> {
    const { results, page_result } = await this.#catalog_repository.getCatalogItems(params);
    const objs = [];
    for (let idx = 0; idx < results.length; idx++) {
      objs.push(results[idx].toObject());
    }
    return Either.right({ results: objs, page_result });
  }

  async createCatalogItem(params: CreateCatalogItemParams): Promise<Either<CatalogItemObject>> {
    const catalog_item_obj = Object.assign({}, params, { id: randomUUID() });
    const catalog_item = new CatalogItem(catalog_item_obj);
    await this.#catalog_repository.createCatalogItem(catalog_item);
    return Either.right(catalog_item.toObject());
  }

  async updateCatalogItem(params: {}): Promise<Either<CatalogItemObject>> {
    return Either.left(new Error());
  }

  async updatePicture(params: {}): Promise<Either<void>> {
    return Either.left(new Error());
  }
}