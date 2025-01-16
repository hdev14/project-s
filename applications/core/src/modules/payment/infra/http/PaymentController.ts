import Logger from "@global/app/Logger";
import PaymentService from "@payment/app/PaymentService";
import HttpStatusCodes from "@shared/HttpStatusCodes";
import types from "@shared/types";
import { Request } from 'express';
import { inject } from "inversify";
import {
  BaseHttpController,
  controller,
  httpGet,
  httpPost,
  request,
  requestParam
} from "inversify-express-utils";

@controller('/api/payments', types.AuthMiddleware)
export default class PaymentController extends BaseHttpController {
  constructor(
    @inject(types.PaymentService) readonly payment_service: PaymentService,
    @inject(types.Logger) readonly logger: Logger
  ) {
    super();
    this.logger.info("Payment's APIs enabled");
  }

  @httpGet('/subscriptions/:subscription_id')
  async getSubscriptionPayments(@requestParam('subscription_id') subscription_id: string) {
    const [, data] = await this.payment_service.getSubscriptionPayments({ subscription_id });
    return this.json(data, HttpStatusCodes.OK);
  }

  @httpGet('/logs')
  async getPaymentLogs(@request() req: Request) {
    return this.ok();
  }

  @httpPost('/webhooks')
  async processPayment(@request() req: Request) {
    return this.ok();
  }
}
