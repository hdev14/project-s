import Mediator from "@shared/Mediator";
import Module from "@shared/Module";
import types from "@shared/types";
import { ContainerModule } from "inversify";
import EmailService from "../app/EmailService";
import GlobalMediator from "../app/GlobalMediator";
import Logger from "../app/Logger";
import SMTPService from "./SMTPService";
import WinstonLogger from "./WinstonLogger";

export default class GlobalModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind) => {
      bind<EmailService>(types.EmailService).to(SMTPService).inSingletonScope();
      bind<Mediator>(types.Mediator).to(GlobalMediator).inSingletonScope();
      bind<Logger>(types.Logger).to(WinstonLogger).inSingletonScope();
    });

    return module;
  }
}
