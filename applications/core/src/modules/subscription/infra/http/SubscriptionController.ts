import Logger from "@global/app/Logger";
import DomainError from "@shared/errors/DomainError";
import NotFoundError from "@shared/errors/NotFoundError";
import HttpStatusCodes from "@shared/HttpStatusCodes";
import { deleteFiles, requestValidator, upload } from "@shared/middlewares";
import { Policies } from "@shared/Principal";
import types from "@shared/types";
import SubscriptionService from "@subscription/app/SubscriptionService";
import { Request } from 'express';
import { readFile } from "fs/promises";
import { inject } from "inversify";
import {
  BaseHttpController,
  controller,
  httpGet,
  httpPatch,
  httpPost,
  request
} from "inversify-express-utils";
import { create_subscription_plan_validation_schema, create_subscription_validation_schema } from "./validations";

@controller('/api/subscriptions', types.AuthMiddleware)
export default class SubscriptionController extends BaseHttpController {
  constructor(
    @inject(types.SubscriptionService) readonly subscription_service: SubscriptionService,
    @inject(types.Logger) readonly logger: Logger
  ) {
    super();
    this.logger.info("Subscriptions's APIs enabled");
  }

  @httpPost('/', requestValidator(create_subscription_validation_schema))
  async createSubscription(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.CREATE_SUBSCRIPTION)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const {
      subscriber_id,
      subscription_plan_id,
      tenant_id,
    } = req.body;

    const [error, data] = await this.subscription_service.createSubscription({
      subscriber_id,
      subscription_plan_id,
      tenant_id,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.json(data, HttpStatusCodes.CREATED);
  }

  @httpPatch('/:subscription_id/activations')
  async activeSubscription(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.UPDATE_SUBSCRIPTION)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

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
    if (!await this.httpContext.user.isInRole(Policies.UPDATE_SUBSCRIPTION)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

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
    if (!await this.httpContext.user.isInRole(Policies.UPDATE_SUBSCRIPTION)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

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

  @httpPost(
    '/plans',
    upload.single('term_file'),
    requestValidator(create_subscription_plan_validation_schema),
    deleteFiles()
  )
  async createSuscriptionPlan(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.CREATE_SUBSCRIPTION_PLAN)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const { item_ids, recurrence_type, tenant_id, billing_day } = req.body;

    let term_file: Buffer | undefined = undefined;

    if (req.file) {
      term_file = await readFile(req.file.path);

      if (req.file.mimetype !== 'application/pdf') {
        return this.json({ message: req.__('validation.pdf') }, HttpStatusCodes.BAD_REQUEST);
      }
    }

    const [error, data] = await this.subscription_service.createSubscriptionPlan({
      item_ids,
      recurrence_type,
      tenant_id,
      term_file,
      billing_day: parseInt(billing_day, 10)
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    if (error instanceof DomainError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.UNPROCESSABLE_CONTENT);
    }

    return this.json(data, HttpStatusCodes.CREATED);
  }

  @httpGet('/plans')
  async getSubscriptionPlans(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.LIST_SUBSCRIPTION_PLANS)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const { tenant_id, page, limit } = req.query;
    const params = (page && limit) ? ({
      tenant_id: tenant_id!.toString(),
      page_options: {
        limit: parseInt(limit.toString(), 10),
        page: parseInt(page.toString(), 10)
      }
    }) : { tenant_id: tenant_id!.toString() };

    const [, data] = await this.subscription_service.getSubscriptionPlans(params);

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpGet('/')
  async getSubscriptions(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.LIST_SUBSCRIPTIONS)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

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
