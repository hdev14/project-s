import Logger from "@global/app/Logger";
import PaymentService from "@payment/app/PaymentService";
import types from "@shared/types";
import { Request } from 'express';
import { inject } from "inversify";
import {
  BaseHttpController,
  controller,
  httpGet,
  httpPost,
  request
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
  async getSubscriptionPayments(@request() req: Request) {
    return this.ok();
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
