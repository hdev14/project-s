import EmailService from "@global/app/EmailService";
import Mediator from "@shared/Mediator";
import Module from "@shared/Module";
import UpdateSubscriptionCommand from "@shared/commands/UpdateSubscriptionCommand";
import types from "@shared/types";
import { SubscriptionPlanRepository } from "@subscription/app/SubscriptionPlanRepository";
import SubscriptionRepository from "@subscription/app/SubscriptionRepository";
import SubscriptionService from "@subscription/app/SubscriptionService";
import UpdateSubscriptionCommandHandler from "@subscription/app/UpdateSubscriptionCommandHandler";
import { ContainerModule } from "inversify";
import './http/SubscriptionController';
import DbSubscriptionPlanRepository from "./persistence/DbSubscriptionPlanRepository";
import DbSubscriptionRepository from "./persistence/DbSubscriptionRepository";

export default class SubscriptionModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind, _unbind, _isBound, _rebind, _unbindAsync, onActivation) => {
      const subscription_repository = new DbSubscriptionRepository();
      const subscription_plan_repository = new DbSubscriptionPlanRepository();
      bind<SubscriptionService>(types.SubscriptionService).to(SubscriptionService).inSingletonScope();
      bind<SubscriptionRepository>(types.SubscriptionRepository).toConstantValue(subscription_repository);
      bind<SubscriptionPlanRepository>(types.SubscriptionPlanRepository).toConstantValue(subscription_plan_repository);
      onActivation<Mediator>(types.Mediator, (context, mediator) => {
        const email_service = context.container.get<EmailService>(types.EmailService);
        mediator.register(
          UpdateSubscriptionCommand.name,
          new UpdateSubscriptionCommandHandler(
            subscription_repository,
            subscription_plan_repository,
            email_service
          ),
        );
        return mediator;
      });
    });

    return module;
  }
}
