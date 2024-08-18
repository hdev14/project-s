import NotFoundError from "@shared/errors/NotFoundError";
import HttpStatusCodes from "@shared/infra/HttpStatusCodes";
import { requestValidator } from "@shared/infra/middlewares";
import types from "@shared/infra/types";
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
import { update_subscriber_validation_schema } from "./validations";

@controller('/api/subscribers')
export default class SubscriberController extends BaseHttpController {
  constructor(@inject(types.SubscriberService) readonly subscriber_service: SubscriberService) {
    super();
  }

  @httpPost('/')
  async createSubscriber(@request() req: Request) {
    return this.ok();
  }

  @httpGet('/:subscriber_id')
  async getSubscriber(@request() req: Request) {
    const { subscriber_id } = req.params;

    const [data, error] = await this.subscriber_service.getSubscriber({
      subscriber_id,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpPatch('/:subscriber_id/addresses', requestValidator(update_subscriber_validation_schema))
  async updateSubscriberAddress(@request() req: Request) {
    const { subscriber_id } = req.params;
    const {
      district,
      number,
      state,
      street,
      complement,
    } = req.body;

    const [, error] = await this.subscriber_service.updateSubscriberAddress({
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

  @httpPatch('/:subscriber_id/infos')
  async updateSubscriberPersonalInfo(@request() req: Request) {
    return this.ok();
  }

  @httpPatch('/:subscriber_id/payment_methods')
  async updateSubscriberPaymentMethod(@request() req: Request) {
    return this.ok();
  }
}
