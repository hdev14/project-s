import Logger from "@global/app/Logger";
import NotFoundError from "@shared/errors/NotFoundError";
import HttpStatusCodes from "@shared/HttpStatusCodes";
import { requestValidator } from "@shared/middlewares";
import { Policies } from "@shared/Principal";
import types from "@shared/types";
import SubscriberService from "@subscriber/app/SubscriberService";
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
import {
  create_subscriber_validation_schema,
  update_subscriber_address_validation_schema,
  update_subscriber_payment_method_validation_schema,
  update_subscriber_perfonal_info_validation_schema
} from "./validations";

@controller('/api/subscribers', types.AuthMiddleware)
export default class SubscriberController extends BaseHttpController {
  constructor(
    @inject(types.SubscriberService) readonly subscriber_service: SubscriberService,
    @inject(types.Logger) readonly logger: Logger
  ) {
    super();
    this.logger.info("Subscriber's APIs enabled");
  }

  @httpPost('/', requestValidator(create_subscriber_validation_schema))
  async createSubscriber(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.CREATE_SUBSCRIBER)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const {
      address,
      document,
      email,
      phone_number,
    } = req.body;

    const [, data] = await this.subscriber_service.createSubscriber({
      address,
      document,
      email,
      phone_number,
    });

    return this.json(data, HttpStatusCodes.CREATED);
  }

  @httpGet('/:subscriber_id')
  async getSubscriber(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.GET_SUBSCRIBER)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const { subscriber_id } = req.params;

    const [error, data] = await this.subscriber_service.getSubscriber({
      subscriber_id,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpPatch(
    '/:subscriber_id/addresses',
    requestValidator(update_subscriber_address_validation_schema)
  )
  async updateSubscriberAddress(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.UPDATE_SUBSCRIBER)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const { subscriber_id } = req.params;
    const {
      district,
      number,
      state,
      street,
      complement,
    } = req.body;

    const [error] = await this.subscriber_service.updateSubscriberAddress({
      subscriber_id,
      district,
      number,
      state,
      street,
      complement,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpPatch(
    '/:subscriber_id/infos',
    requestValidator(update_subscriber_perfonal_info_validation_schema)
  )
  async updateSubscriberPersonalInfo(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.UPDATE_SUBSCRIBER)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const { subscriber_id } = req.params;
    const {
      document,
      email,
      phone_number
    } = req.body;

    const [error] = await this.subscriber_service.updateSubscriberPerfonalInfo({
      subscriber_id,
      document,
      email,
      phone_number
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpPatch(
    '/:subscriber_id/payment_methods',
    requestValidator(update_subscriber_payment_method_validation_schema)
  )
  async updateSubscriberPaymentMethod(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.UPDATE_SUBSCRIBER)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const { subscriber_id } = req.params;
    const { payment_type, credit_card_token } = req.body;

    const [error] = await this.subscriber_service.updateSubscriberPaymentMethod({
      subscriber_id,
      payment_type,
      credit_card_token,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }
}
