import { AttributeValue } from "@catalog/domain/Attribute";
import CatalogItem, { CatalogItemObject } from "@catalog/domain/CatalogItem";
import Mediator from "@shared/Mediator";
import UserExistsCommand from "@shared/commands/UserExistsCommand";
import DomainError from "@shared/errors/DomainError";
import NotFoundError from "@shared/errors/NotFoundError";
import types from "@shared/infra/types";
import Either from "@shared/utils/Either";
import { PageOptions, PageResult } from "@shared/utils/Pagination";
import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import 'reflect-metadata';
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
  amount: number;
  attributes: Array<AttributeValue>;
  is_service: boolean;
  picture_url?: string;
  tenant_id: string;
};

export type UpdateCatalogItemParams = Partial<Omit<CreateCatalogItemParams, 'tenant_id' | 'is_service'>> & {
  catalog_item_id: string;
};

@injectable()
export default class CatalogService {
  #catalog_repository: CatalogRepository;
  #mediator: Mediator;

  constructor(
    @inject(types.CatalogRepository) catalog_repository: CatalogRepository,
    @inject(types.Mediator) mediator: Mediator
  ) {
    this.#catalog_repository = catalog_repository;
    this.#mediator = mediator;
  }

  async getCatalogItems(params: GetCatalogItemsParams): Promise<Either<GetCatalogItemsResult>> {
    return Either.right(await this.#catalog_repository.getCatalogItems(params));
  }

  async createCatalogItem(params: CreateCatalogItemParams): Promise<Either<CatalogItemObject>> {
    try {
      const exists = await this.#mediator.send<boolean>(new UserExistsCommand(params.tenant_id));

      if (!exists) {
        return Either.left(new NotFoundError('notfound.company'));
      }

      const catalog_item = new CatalogItem(Object.assign({}, params, { id: randomUUID() }));

      await this.#catalog_repository.createCatalogItem(catalog_item);

      return Either.right(catalog_item.toObject());
    } catch (error) {
      if (error instanceof DomainError) {
        return Either.left(error);
      }

      throw error;
    }
  }

  async updateCatalogItem(params: UpdateCatalogItemParams): Promise<Either<void>> {
    const catalog_item = await this.#catalog_repository.getCatalogItemById(params.catalog_item_id);

    if (!catalog_item) {
      return Either.left(new NotFoundError('notfound.catalog_item'));
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
