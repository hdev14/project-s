import CatalogRepository from "@catalog/app/CatalogRepository";
import CatalogItem from "@catalog/domain/CatalogItem";
import PaginationOptions from "@shared/utils/PaginationOptions";

export default class DbCatalogRepository implements CatalogRepository {
  getCatalogItems(pagination: PaginationOptions): Promise<CatalogItem[]> {
    throw new Error("Method not implemented.");
  }
  createCatalogItem(catalog_item: CatalogItem): Promise<void> {
    throw new Error("Method not implemented.");
  }
  updateCatalogItem(catalog_item: CatalogItem): Promise<void> {
    throw new Error("Method not implemented.");
  }
}