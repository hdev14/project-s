import CatalogRepository from "@catalog/app/CatalogRepository";
import CatalogService from "@catalog/app/CatalogService";
import Module from "@shared/infra/Module";
import types from "@shared/infra/types";
import { ContainerModule } from "inversify";
import './http/CatalogController';
import DbCatalogRepository from "./persistence/DbCatalogRepository";

export default class CatalogModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind) => {
      bind<CatalogService>(types.CatalogService).to(CatalogService).inSingletonScope();
      bind<CatalogRepository>(types.CatalogRepository).to(DbCatalogRepository).inSingletonScope();
    });

    return module;
  }
}