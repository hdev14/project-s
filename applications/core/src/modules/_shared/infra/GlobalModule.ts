import Mediator from "@shared/Mediator";
import Module from "@shared/infra/Module";
import types from "@shared/infra/types";
import { ContainerModule } from "inversify";

export default class GlobalModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind) => {
      bind<Mediator>(types.Mediator).to(Mediator).inSingletonScope();
    });

    return module;
  }
}