import CatalogItem from "@catalog/domain/CatalogItem";
import { PageOptions, PaginatedResult } from "@shared/utils/Pagination";

export type CatalogItemsFilter = {
  tenant_id?: string;
  page_options?: PageOptions;
};

export default interface CatalogRepository {
  getCatalogItems(filter?: CatalogItemsFilter): Promise<PaginatedResult<CatalogItem>>;
  createCatalogItem(catalog_item: CatalogItem): Promise<void>;
  updateCatalogItem(catalog_item: CatalogItem): Promise<void>;
  deleteCatalogItem(id: string): Promise<void>;
}