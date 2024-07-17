import Mediator from "@shared/Mediator";
import Module from "@shared/infra/Module";
import types from "@shared/infra/types";
import { ContainerModule } from "inversify";
import EmailService from "./EmailService";
import SMTPService from "./SMTPService";

export default class SharedModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind) => {
      bind<EmailService>(types.EmailService).to(SMTPService).inSingletonScope();
      bind<Mediator>(types.Mediator).to(Mediator).inSingletonScope();
    });

    return module;
  }
}