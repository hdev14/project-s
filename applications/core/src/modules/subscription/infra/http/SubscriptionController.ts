// TODO: add multer in the create subscription plan endpoint
// https://github.com/expressjs/multer

import Logger from "@global/app/Logger";
import DomainError from "@shared/errors/DomainError";
import NotFoundError from "@shared/errors/NotFoundError";
import HttpStatusCodes from "@shared/HttpStatusCodes";
import { requestValidator } from "@shared/middlewares";
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
import { create_subscription_validation_schema } from "./validations";

@controller('/api/subscriptions')
export default class SubscriptionController extends BaseHttpController {
  constructor(
    @inject(types.SubscriptionService) readonly subscription_service: SubscriptionService,
    @inject(types.Logger) readonly logger: Logger
  ) {
    super();
    this.logger.info("Subscriptions's APIs enabled");
  }

  @httpPost('/', requestValidator(create_subscription_validation_schema))
  async createSubscriptions(@request() req: Request) {
    const {
      subscriber_id,
      subscription_plan_id,
      tenant_id,
    } = req.body;

    const [error, data] = await this.subscription_service.createSubscription({
      subscriber_id,
      subscription_plan_id,
      tenant_id
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.json(data, HttpStatusCodes.CREATED);
  }

  @httpPatch('/:subscription_id/activations')
  async activeSubscription(@request() req: Request) {
    const { subscription_id } = req.params;

    const [error] = await this.subscription_service.activeSubscription({ subscription_id });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    if (error instanceof DomainError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.UNPROCESSABLE_CONTENT);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpPatch('/:subscription_id/pauses')
  async pauseSubscription(@request() req: Request) {
    const { subscription_id } = req.params;

    const [error] = await this.subscription_service.pauseSubscription({ subscription_id });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    if (error instanceof DomainError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.UNPROCESSABLE_CONTENT);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpPatch('/:subscription_id/cancellations')
  async cancelSubscription(@request() req: Request) {
    const { subscription_id } = req.params;

    const [error] = await this.subscription_service.cancelSubscription({ subscription_id });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    if (error instanceof DomainError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.UNPROCESSABLE_CONTENT);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpPost('/plans')
  async createSuscriptionPlan(@request() req: Request) {
    return this.ok();
  }

  @httpGet('/plans')
  async getSubscriptionPlans(@request() req: Request) {
    return this.ok();
  }

  @httpGet('/')
  async getSubscriptions(@request() req: Request) {
    const { tenant_id, page, limit } = req.query;
    const params = (page && limit) ? ({
      tenant_id: tenant_id!.toString(),
      page_options: {
        limit: parseInt(limit.toString(), 10),
        page: parseInt(page.toString(), 10)
      }
    }) : { tenant_id: tenant_id!.toString() };

    const [, data] = await this.subscription_service.getSubscriptions(params);

    return this.json(data, HttpStatusCodes.OK);
  }
}
