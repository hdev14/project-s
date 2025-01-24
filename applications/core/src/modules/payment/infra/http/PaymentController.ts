import Logger from "@global/app/Logger";
import PaymentService from "@payment/app/PaymentService";
import NotFoundError from "@shared/errors/NotFoundError";
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

  @httpGet('/:payment_id/logs')
  async getPaymentLogs(@request() req: Request) {
    const { payment_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const [, data] = await this.payment_service.getPaymentLogs({
      payment_id,
      page_options: {
        limit: parseInt(limit!.toString(), 10),
        page: parseInt(page!.toString(), 10),
      }
    });

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpPost('/webhooks/mp')
  async processPayment(@request() req: Request) {
    // TODO: add mercado pago auth logic to check webhook notifications
    const { data } = req.body;

    const [error] = await this.payment_service.processPayment({
      external_id: data.id,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.ok();
  }
}
