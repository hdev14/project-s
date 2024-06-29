import CatalogItem from "@catalog/domain/CatalogItem";
import { PageOptions, PaginatedResult } from "@shared/utils/Pagination";

export default interface CatalogRepository {
  getCatalogItems(page_options?: PageOptions): Promise<PaginatedResult<CatalogItem>>;
  createCatalogItem(catalog_item: CatalogItem): Promise<void>;
  updateCatalogItem(catalog_item: CatalogItem): Promise<void>;
  deleteCatalogItem(id: string): Promise<void>;
}