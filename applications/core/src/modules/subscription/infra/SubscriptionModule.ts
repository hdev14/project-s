import Module from "@shared/Module";
import types from "@shared/types";
import { SubscriptionPlanRepository } from "@subscription/app/SubscriptionPlanRepository";
import SubscriptionRepository from "@subscription/app/SubscriptionRepository";
import SubscriptionService from "@subscription/app/SubscriptionService";
import { ContainerModule } from "inversify";
import './http/SubscriptionController';
import DbSubscriptionPlanRepository from "./persistence/DbSubscriptionPlanRepository";
import DbSubscriptionRepository from "./persistence/DbSubscriptionRepository";

export default class SubscriptionModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind) => {
      bind<SubscriptionService>(types.SubscriptionService).to(SubscriptionService).inSingletonScope();
      bind<SubscriptionRepository>(types.SubscriptionRepository).to(DbSubscriptionRepository).inSingletonScope();
      bind<SubscriptionPlanRepository>(types.SubscriptionPlanRepository).to(DbSubscriptionPlanRepository).inSingletonScope();
    });

    return module;
  }
}
