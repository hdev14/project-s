import { AttributeValue } from "@catalog/domain/Attribute";
import CatalogItem, { CatalogItemObject } from "@catalog/domain/CatalogItem";
import Mediator from "@shared/Mediator";
import TenantExistsCommand from "@shared/TenantExistsCommand";
import NotFoundError from "@shared/errors/NotFoundError";
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
  tenant_id: string;
};

export type UpdateCatalogItemParams = Partial<Omit<CreateCatalogItemParams, 'tenant_id'>> & { catalog_item_id: string; };

export default class CatalogService {
  #catalog_repository: CatalogRepository;
  #mediator: Mediator;

  constructor(catalog_repository: CatalogRepository, mediator: Mediator) {
    this.#catalog_repository = catalog_repository;
    this.#mediator = mediator;
  }

  async getCatalogItems(params: GetCatalogItemsParams): Promise<Either<GetCatalogItemsResult>> {
    const { results, page_result } = await this.#catalog_repository.getCatalogItems(params);
    return Either.right({ results: results.toObjectList(), page_result });
  }

  async createCatalogItem(params: CreateCatalogItemParams): Promise<Either<CatalogItemObject>> {
    const exists = await this.#mediator.send<boolean>(new TenantExistsCommand(params.tenant_id));

    if (!exists) {
      return Either.left(new NotFoundError('Empresa não encontrada'));
    }

    const catalog_item = new CatalogItem(Object.assign({}, params, { id: randomUUID() }));

    await this.#catalog_repository.createCatalogItem(catalog_item);

    return Either.right(catalog_item.toObject());
  }

  async updateCatalogItem(params: UpdateCatalogItemParams): Promise<Either<void>> {
    const catalog_item = await this.#catalog_repository.getCatalogItemById(params.catalog_item_id);

    if (!catalog_item) {
      return Either.left(new NotFoundError('Item não encontrado'));
    }

    const obj = catalog_item.toObject();

    catalog_item.name = params.name ?? obj.name;
    catalog_item.description = params.description ?? obj.description;
    catalog_item.attributes = params.attributes ?? obj.attributes;
    catalog_item.picture_url = params.picture_url ?? obj.picture_url;

    await this.#catalog_repository.updateCatalogItem(catalog_item);

    return Either.right();
  }
}