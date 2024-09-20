
import { CatalogItemProps } from "@catalog/domain/CatalogItem";
import GetCatalogItemCommand from "@shared/commands/GetCatalogItemCommand";
import NotFoundError from "@shared/errors/NotFoundError";
import Handler from "@shared/Handler";
import CatalogRepository from "./CatalogRepository";

export default class GetCatalogItemCommandHandler implements Handler<GetCatalogItemCommand, CatalogItemProps> {
  #catalog_repository: CatalogRepository;

  constructor(catalog_repository: CatalogRepository) {
    this.#catalog_repository = catalog_repository;
  }

  async handle(command: GetCatalogItemCommand): Promise<CatalogItemProps> {
    const catalog_item = await this.#catalog_repository.getCatalogItemById(command.catalog_item_id);

    if (!catalog_item) {
      throw new NotFoundError('notfound.catalog_item');
    }

    return catalog_item.toObject();
  }
}
