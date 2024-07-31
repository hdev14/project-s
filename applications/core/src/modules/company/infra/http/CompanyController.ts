import CompanyService from "@company/app/CompanyService";
import NotFoundError from "@shared/errors/NotFoundError";
import HttpStatusCodes from "@shared/infra/HttpStatusCodes";
import { requestValidator } from "@shared/infra/middlewares";
import types from "@shared/infra/types";
import { Request } from 'express';
import { inject } from "inversify";
import {
  BaseHttpController,
  controller,
  httpDelete,
  httpGet,
  httpPatch,
  httpPost,
  httpPut,
  request
} from "inversify-express-utils";
import { update_company_address_validation_schema, update_company_bank_validation_schema } from "./validations";

@controller('/api/companies')
export default class CompanyController extends BaseHttpController {
  constructor(@inject(types.CompanyService) readonly company_service: CompanyService) {
    super();
  }

  @httpPost('/')
  async createCompany(@request() req: Request) {
    return this.ok();
  }

  @httpGet('/')
  async getCompanies(@request() req: Request) {
    const { page, limit } = req.query;
    const params = (page && limit) ? ({
      page_options: {
        limit: parseInt(limit.toString(), 10),
        page: parseInt(page.toString(), 10)
      }
    }) : {};

    const [data] = await this.company_service.getCompanies(params);

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpGet('/:id')
  async getCompany(@request() req: Request) {
    const { id } = req.params;

    const [data, error] = await this.company_service.getCompany({
      company_id: id,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpPatch('/:id/addresses', requestValidator(update_company_address_validation_schema))
  async updateCompanyAddress(@request() req: Request) {
    const { id } = req.params;
    const {
      street,
      district,
      state,
      number,
      complement,
    } = req.body;

    const [, error] = await this.company_service.updateCompanyAddress({
      company_id: id,
      street,
      district,
      state,
      number,
      complement,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpPatch('/:id/banks', requestValidator(update_company_bank_validation_schema))
  async updateCompanyBank(@request() req: Request) {
    const { id } = req.params;
    const {
      account,
      account_digit,
      agency,
      agency_digit,
      bank_code,
    } = req.body;

    const [, error] = await this.company_service.updateCompanyBank({
      company_id: id,
      account,
      account_digit,
      agency,
      agency_digit,
      bank_code,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpPatch('/:id/brands')
  async updateCompanyBrand() {
    return this.ok();
  }

  @httpPost('/employees')
  async createEmployee() {
    return this.ok();
  }

  @httpDelete('/employees/:id')
  async deactivateEmployee() {
    return this.ok();
  }

  @httpPost('/service-logs')
  async createServiceLog() {
    return this.ok();
  }

  @httpGet('/service-logs')
  async getServiceLogs() {
    return this.ok();
  }

  @httpPost('/commissions')
  async createCommission() {
    return this.ok();
  }

  @httpPut('/commissions/:id')
  async updateCommission() {
    return this.ok();
  }

  @httpGet('/commissions/:id')
  async getCommission() {
    return this.ok();
  }
}