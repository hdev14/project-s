import { AttributeValue } from "@catalog/domain/Attribute";
import CatalogItem, { CatalogItemProps } from "@catalog/domain/CatalogItem";
import FileStorage from "@global/app/FileStorage";
import Mediator from "@shared/Mediator";
import GetUserCommand from "@shared/commands/GetUserCommand";
import DomainError from "@shared/errors/DomainError";
import NotFoundError from "@shared/errors/NotFoundError";
import types from "@shared/types";
import Either from "@shared/utils/Either";
import { PageInfo, PageOptions } from "@shared/utils/Pagination";
import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import 'reflect-metadata';
import CatalogRepository from "./CatalogRepository";

export type GetCatalogItemsParams = {
  tenant_id?: string;
  page_options?: PageOptions;
};

export type GetCatalogItemsResult = {
  result: Array<CatalogItemProps>;
  page_info?: PageInfo;
};

export type CreateCatalogItemParams = {
  name: string;
  description: string;
  amount: number;
  attributes: Array<AttributeValue>;
  is_service: boolean;
  picture_file?: Buffer;
  tenant_id: string;
};

export type UpdateCatalogItemParams = Partial<Omit<CreateCatalogItemParams, 'tenant_id' | 'is_service'>> & {
  catalog_item_id: string;
};

@injectable()
export default class CatalogService {
  readonly #catalog_repository: CatalogRepository;
  readonly #mediator: Mediator;
  readonly #file_storage: FileStorage;

  constructor(
    @inject(types.CatalogRepository) catalog_repository: CatalogRepository,
    @inject(types.Mediator) mediator: Mediator,
    @inject(types.FileStorage) file_storage: FileStorage
  ) {
    this.#catalog_repository = catalog_repository;
    this.#mediator = mediator;
    this.#file_storage = file_storage;
  }

  async getCatalogItems(params: GetCatalogItemsParams): Promise<Either<GetCatalogItemsResult>> {
    const page = await this.#catalog_repository.getCatalogItems(params)
    return Either.right(page.toRaw());
  }

  async createCatalogItem(params: CreateCatalogItemParams): Promise<Either<CatalogItemProps>> {
    try {
      const exists = await this.#mediator.send<any>(new GetUserCommand(params.tenant_id));

      if (!exists) {
        return Either.left(new NotFoundError('notfound.company'));
      }

      const catalog_item_props: CatalogItemProps = {
        id: randomUUID(),
        name: params.name,
        description: params.description,
        amount: params.amount,
        attributes: params.attributes,
        is_service: params.is_service,
        picture_url: undefined,
        tenant_id: params.tenant_id,
      };

      if (params.picture_file) {
        catalog_item_props.picture_url = await this.#file_storage.storeFile({
          bucket_name: `tenant-${params.tenant_id}`,
          file: params.picture_file,
          folder: 'catalog_item_pictures',
          name: `picture_${catalog_item_props.id}`,
        });
      }

      const catalog_item = new CatalogItem(catalog_item_props);

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

    if (params.picture_file) {
      catalog_item.picture_url = await this.#file_storage.storeFile({
        bucket_name: `tenant-${obj.tenant_id}`,
        file: params.picture_file,
        folder: 'catalog_item_pictures',
        name: `picture_${obj.id}`,
      });
    }

    await this.#catalog_repository.updateCatalogItem(catalog_item);

    return Either.right();
  }
}
