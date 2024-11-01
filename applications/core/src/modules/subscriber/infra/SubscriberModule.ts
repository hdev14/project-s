import GetSubscriberCommand from "@shared/commands/GetSubscriberCommand";
import Mediator from "@shared/Mediator";
import Module from "@shared/Module";
import types from "@shared/types";
import GetSubscriberCommandHandler from "@subscriber/app/GetSubscriberCommandHandler";
import SubscriberRepository from "@subscriber/app/SubscriberRepository";
import SubscriberService from "@subscriber/app/SubscriberService";
import { ContainerModule } from "inversify";
import './http/SubscriberController';
import DbSubscriberRepository from "./persistence/DbSubscriberRepository";

export default class SubscriberModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind, _unbind, _isBound, _rebind, _unbindAsync, onActivation) => {
      const subscriber_repository = new DbSubscriberRepository();
      bind<SubscriberService>(types.SubscriberService).to(SubscriberService).inSingletonScope();
      bind<SubscriberRepository>(types.SubscriberRepository).toConstantValue(subscriber_repository);
      onActivation<Mediator>(types.Mediator, (_context, mediator) => {
        mediator.register(
          GetSubscriberCommand.name,
          new GetSubscriberCommandHandler(subscriber_repository),
        );
        return mediator;
      });
    });

    return module;
  }
}
