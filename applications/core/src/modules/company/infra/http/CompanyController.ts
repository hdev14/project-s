import CompanyService from "@company/app/CompanyService";
import NotFoundError from "@shared/errors/NotFoundError";
import HttpStatusCodes from "@shared/infra/HttpStatusCodes";
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

  @httpPatch('/:id/addresses')
  async updateCompanyAddress() {
    return this.ok();
  }

  @httpPatch('/:id/banks')
  async updateCompanyBank() {
    return this.ok();
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