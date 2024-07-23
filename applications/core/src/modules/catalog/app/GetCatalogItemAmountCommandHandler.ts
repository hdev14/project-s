import GetCatalogItemAmountCommand from "@shared/commands/GetCatalogItemAmountCommand";
import NotFoundError from "@shared/errors/NotFoundError";
import Handler from "@shared/Handler";
import CatalogRepository from "./CatalogRepository";

export default class GetCatalogItemAmountCommandHandler implements Handler<GetCatalogItemAmountCommand, number> {
  #catalog_repository: CatalogRepository;

  constructor(catalog_repository: CatalogRepository) {
    this.#catalog_repository = catalog_repository;
  }

  async handle(command: GetCatalogItemAmountCommand): Promise<number> {
    const catalog_item = await this.#catalog_repository.getCatalogItemById(command.catalog_item_id);

    if (!catalog_item) {
      throw new NotFoundError('notfound.catalog_item');
    }

    return catalog_item.toObject().amount;
  }
}