import Command from "@shared/Command";

type UpdateSubscriptionCommandParams = {
  subscription_id: string;
  customer_email: string;
  pause_subscription?: boolean;
  reason?: string;
};

export default class UpdateSubscriptionCommand extends Command {
  readonly subscription_id: string;
  readonly customer_email: string;
  readonly pause_subscription?: boolean;
  readonly reason?: string;

  constructor(params: UpdateSubscriptionCommandParams) {
    super();
    this.subscription_id = params.subscription_id;
    this.customer_email = params.customer_email;
    this.pause_subscription = params.pause_subscription;
    this.reason = params.reason;
  }
}
