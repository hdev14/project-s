import CatalogItem from "@catalog/domain/CatalogItem";
import PaginationOptions from "@shared/utils/PaginationOptions";

export default interface CatalogRepository {
  getCatalogItems(pagination: PaginationOptions): Promise<Array<CatalogItem>>;
  createCatalogItem(catalog_item: CatalogItem): Promise<void>;
  updateCatalogItem(catalog_item: CatalogItem): Promise<void>;
}