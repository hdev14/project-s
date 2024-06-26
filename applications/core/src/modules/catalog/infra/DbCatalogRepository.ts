import CatalogRepository from "@catalog/app/CatalogRepository";
import CatalogItem from "@catalog/domain/CatalogItem";
import { PageOptions } from "@shared/utils/Pagination";

export default class DbCatalogRepository implements CatalogRepository {
  getCatalogItems(pagination: PageOptions): Promise<CatalogItem[]> {
    throw new Error("Method not implemented.");
  }
  createCatalogItem(catalog_item: CatalogItem): Promise<void> {
    throw new Error("Method not implemented.");
  }
  updateCatalogItem(catalog_item: CatalogItem): Promise<void> {
    throw new Error("Method not implemented.");
  }
}