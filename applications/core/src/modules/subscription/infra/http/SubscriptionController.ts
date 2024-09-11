// TODO: add multer in the create subscription plan endpoint
// https://github.com/expressjs/multer

import Logger from "@global/app/Logger";
import types from "@shared/types";
import SubscriptionService from "@subscription/app/SubscriptionService";
import { Request } from 'express';
import { inject } from "inversify";
import {
  BaseHttpController,
  controller,
  httpGet,
  httpPatch,
  httpPost,
  request
} from "inversify-express-utils";

@controller('/api/subscriptions')
export default class SubscriptionController extends BaseHttpController {
  constructor(
    @inject(types.SubscriptionService) readonly subscription_service: SubscriptionService,
    @inject(types.Logger) readonly logger: Logger
  ) {
    super();
    this.logger.info("Subscriptions's APIs enabled");
  }

  @httpPost('/')
  async createSubscriptions(@request() req: Request) {
    return this.ok();
  }

  @httpPatch('/:subscription_id/activations')
  async activeSubscription(@request() req: Request) {
    return this.ok();
  }

  @httpPatch('/:subscription_id/pauses')
  async pauseSubscription(@request() req: Request) {
    return this.ok();
  }

  @httpPatch('/:subscription_id/cancellations')
  async cancelSubscription(@request() req: Request) {
    return this.ok();
  }

  @httpGet('/plans')
  async getSubscriptionPlans(@request() req: Request) {
    return this.ok();
  }

  @httpGet('/')
  async getSubscriptions(@request() req: Request) {
    return this.ok();
  }
}
