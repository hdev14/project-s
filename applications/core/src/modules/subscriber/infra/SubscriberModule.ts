import Module from "@shared/Module";
import types from "@shared/types";
import SubscriberRepository from "@subscriber/app/SubscriberRepository";
import SubscriberService from "@subscriber/app/SubscriberService";
import { ContainerModule } from "inversify";
import './http/SubscriberController';
import DbSubscriberRepository from "./persistence/DbSubscriberRepository";

export default class SubscriberModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind) => {
      bind<SubscriberService>(types.SubscriberService).to(SubscriberService).inSingletonScope();
      bind<SubscriberRepository>(types.SubscriberRepository).to(DbSubscriberRepository).inSingletonScope();
    });

    return module;
  }
}
