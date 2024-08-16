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
    return this.ok();
  }

  @httpPatch('/:subscriber_id/addresses')
  async updateSubscriberAddress(@request() req: Request) {
    return this.ok();
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
