import CatalogRepository from '@catalog/app/CatalogRepository';
import CatalogService from '@catalog/app/CatalogService';
import { mock } from 'jest-mock-extended';

describe('CatalogService unit tests', () => {
  const catalog_repository_mock = mock<CatalogRepository>();
  const catalog_service = new CatalogService(catalog_repository_mock);

  describe('CatalogService.getCatalogItems', () => {
    it.todo("returns a list of catalog items");
  });
});