import EmailService from "@global/app/EmailService";
import UpdateSubscriptionCommand from "@shared/commands/UpdateSubscriptionCommand";
import Handler from "@shared/Handler";
import { SubscriptionPlanRepository } from "./SubscriptionPlanRepository";
import SubscriptionRepository from "./SubscriptionRepository";

export default class UpdateSubscriptionCommandHandler implements Handler<UpdateSubscriptionCommand, void> {
  #subscription_repository: SubscriptionRepository;
  #subscription_plan_repository: SubscriptionPlanRepository;
  #email_service: EmailService;

  constructor(
    subscription_repository: SubscriptionRepository,
    subscription_plan_repository: SubscriptionPlanRepository,
    email_service: EmailService
  ) {
    this.#subscription_repository = subscription_repository;
    this.#subscription_plan_repository = subscription_plan_repository;
    this.#email_service = email_service;
  }

  async handle(command: UpdateSubscriptionCommand): Promise<void> {
    const subscription = (await this.#subscription_repository.getSubscriptionById(command.subscription_id))!;

    if (command.pause_subscription) {
      subscription.pause();
    }

    if (!command.pause_subscription) {
      subscription.active();
      const subscription_plan = (await this.#subscription_plan_repository.getSubscriptionPlanById(subscription!.toObject().subscription_plan_id))!;
      subscription_plan.updateNextBillingDate();
      await this.#subscription_plan_repository.updateSubscriptionPlan(subscription_plan);
    }

    await this.#subscription_repository.updateSubscription(subscription);

    if (subscription.isPaused()) {
      await this.#email_service.send({
        email: command.customer_email,
        title: 'Assinatura Pausada',
        message: `Sua assinatura foi pausada pelo seguinte motivo: ${command.reason}`,
      });
      return;
    }

    await this.#email_service.send({
      email: command.customer_email,
      title: 'Assinatura Renovada',
      message: 'Sua assinatura foi renovada com sucesso'
    });
  }
}
