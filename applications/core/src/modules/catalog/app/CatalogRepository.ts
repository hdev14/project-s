import CatalogItem from "@catalog/domain/CatalogItem";
import { PageOptions } from "@shared/utils/Pagination";

export default interface CatalogRepository {
  getCatalogItems(pagination: PageOptions): Promise<Array<CatalogItem>>;
  createCatalogItem(catalog_item: CatalogItem): Promise<void>;
  updateCatalogItem(catalog_item: CatalogItem): Promise<void>;
}