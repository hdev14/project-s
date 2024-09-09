import CatalogRepository from "@catalog/app/CatalogRepository";
import CatalogService from "@catalog/app/CatalogService";
import GetCatalogItemCommandHandler from "@catalog/app/GetCatalogItemCommandHandler";
import GetCatalogItemCommand from "@shared/commands/GetCatalogItemCommand";
import Mediator from "@shared/Mediator";
import Module from "@shared/Module";
import types from "@shared/types";
import { ContainerModule } from "inversify";
import './http/CatalogController';
import DbCatalogRepository from "./persistence/DbCatalogRepository";

export default class CatalogModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind, _unbind, _isBound, _rebind, _unbindAsync, onActivation) => {
      const catalog_repository = new DbCatalogRepository();
      bind<CatalogService>(types.CatalogService).to(CatalogService).inSingletonScope();
      bind<CatalogRepository>(types.CatalogRepository).toConstantValue(catalog_repository);
      onActivation<Mediator>(types.Mediator, (_context, mediator) => {
        mediator.register(
          GetCatalogItemCommand.name,
          new GetCatalogItemCommandHandler(catalog_repository),
        );
        return mediator;
      });
    });

    return module;
  }
}
