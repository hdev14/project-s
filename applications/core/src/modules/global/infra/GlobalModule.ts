/* eslint-disable @typescript-eslint/no-unused-vars */
import FileStorage from "@global/app/FileStorage";
import Consumer from "@shared/Consumer";
import Mediator from "@shared/Mediator";
import Module from "@shared/Module";
import Queue from "@shared/Queue";
import types from "@shared/types";
import { Processor } from "bullmq";
import { ContainerModule, interfaces } from "inversify";
import EmailService from "../app/EmailService";
import GlobalMediator from "../app/GlobalMediator";
import Logger from "../app/Logger";
import BullMQConsumer from "./BullMQConsumer";
import BullMQueue from "./BullMQueue";
import MinIOStorage from "./MinIOStorage";
import SMTPService from "./SMTPService";
import WinstonLogger from "./WinstonLogger";

export default class GlobalModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind, _unbind, _isBound, _rebind, _unbindAsync, _onActivation, _onDeactivation) => {
      bind<EmailService>(types.EmailService).to(SMTPService).inSingletonScope();
      bind<Mediator>(types.Mediator).to(GlobalMediator).inSingletonScope();
      bind<Logger>(types.Logger).to(WinstonLogger).inSingletonScope();
      // bind<Logger>(types.Logger).to(OpenTelemetryLogger).inSingletonScope();
      bind<FileStorage>(types.FileStorage).to(MinIOStorage).inSingletonScope();
      bind<interfaces.Newable<Queue>>(types.NewableQueue).toConstructor(BullMQueue);
      bind<interfaces.Newable<Consumer<Parameters<Processor>>>>(types.NewableConsumer).toConstructor(BullMQConsumer);
    });

    return module;
  }
}
