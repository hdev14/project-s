import CompanyService from "@company/app/CompanyService";
import AlreadyRegisteredError from "@shared/errors/AlreadyRegisteredError";
import DomainError from "@shared/errors/DomainError";
import NotFoundError from "@shared/errors/NotFoundError";
import HttpStatusCodes from "@shared/infra/HttpStatusCodes";
import Logger from "@shared/infra/Logger";
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
import {
  create_commission_validation_schema,
  create_company_validation_schema,
  create_employee_validation_schema,
  create_service_log_validation_schema,
  update_commission_validation_schema,
  update_company_address_validation_schema,
  update_company_bank_validation_schema,
  update_company_brand_validation_schema
} from "./validations";

@controller('/api/companies')
export default class CompanyController extends BaseHttpController {
  constructor(
    @inject(types.CompanyService) readonly company_service: CompanyService,
    @inject(types.Logger) readonly logger: Logger
  ) {
    super();
    this.logger.info("Company's APIs enabled");
  }

  @httpPost('/', requestValidator(create_company_validation_schema))
  async createCompany(@request() req: Request) {
    const {
      access_plan_id,
      address,
      bank,
      document,
      email,
      name,
    } = req.body;

    const [error, data] = await this.company_service.createCompany({
      access_plan_id,
      address,
      bank,
      document,
      email,
      name,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    if (error instanceof AlreadyRegisteredError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.CONFLICT);
    }


    return this.json(data, HttpStatusCodes.CREATED);
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

    const [, data] = await this.company_service.getCompanies(params);

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpGet('/:company_id')
  async getCompany(@request() req: Request) {
    const { company_id } = req.params;

    const [error, data] = await this.company_service.getCompany({
      company_id,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpPatch('/:company_id/addresses', requestValidator(update_company_address_validation_schema))
  async updateCompanyAddress(@request() req: Request) {
    const { company_id } = req.params;
    const {
      street,
      district,
      state,
      number,
      complement,
    } = req.body;

    const [error] = await this.company_service.updateCompanyAddress({
      company_id,
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

  @httpPatch('/:company_id/banks', requestValidator(update_company_bank_validation_schema))
  async updateCompanyBank(@request() req: Request) {
    const { company_id } = req.params;
    const {
      account,
      account_digit,
      agency,
      agency_digit,
      bank_code,
    } = req.body;

    const [error] = await this.company_service.updateCompanyBank({
      company_id,
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

  @httpPatch('/:company_id/brands', requestValidator(update_company_brand_validation_schema))
  async updateCompanyBrand(@request() req: Request) {
    const { company_id } = req.params;
    const { color, logo_url } = req.body;

    const [error] = await this.company_service.updateCompanyBrand({
      company_id,
      color,
      logo_url,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpPost(
    '/:company_id/employees',
    requestValidator(create_employee_validation_schema)
  )
  async createEmployee(@request() req: Request) {
    const { company_id } = req.params;
    const {
      document,
      email,
      name,
      policies,
    } = req.body;

    const [error, data] = await this.company_service.createEmployee({
      document,
      email,
      name,
      policies,
      tenant_id: company_id,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.json(data, HttpStatusCodes.CREATED);
  }

  @httpDelete('/:company_id/employees/:employee_id')
  async deactivateEmployee(@request() req: Request) {
    const { employee_id } = req.params;

    const [error] = await this.company_service.deactivateEmployee({
      employee_id
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpPost('/:company_id/service-logs', requestValidator(create_service_log_validation_schema))
  async createServiceLog(@request() req: Request) {
    const { company_id } = req.params;
    const {
      customer_id,
      employee_id,
      service_id,
    } = req.body;

    const [error, data] = await this.company_service.createServiceLog({
      customer_id,
      employee_id,
      service_id,
      tenant_id: company_id,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.json(data, HttpStatusCodes.CREATED);
  }

  @httpGet('/:company_id/service-logs')
  async getServiceLogs(@request() req: Request) {
    const { company_id } = req.params;
    const { page, limit } = req.query;
    const params = (page && limit) ? ({
      tenant_id: company_id,
      page_options: {
        limit: parseInt(limit.toString(), 10),
        page: parseInt(page.toString(), 10)
      }
    }) : { tenant_id: company_id };

    const [, data] = await this.company_service.getServiceLogs(params);

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpPost(
    '/:company_id/commissions',
    requestValidator(create_commission_validation_schema)
  )
  async createCommission(@request() req: Request) {
    const { company_id } = req.params;
    const {
      catalog_item_id,
      tax,
      tax_type,
    } = req.body;

    const [error, data] = await this.company_service.createCommission({
      catalog_item_id,
      tax,
      tax_type,
      tenant_id: company_id,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    if (error instanceof DomainError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.BAD_REQUEST);
    }

    return this.json(data, HttpStatusCodes.CREATED);
  }

  @httpPut(
    '/:company_id/commissions/:commission_id',
    requestValidator(update_commission_validation_schema)
  )
  async updateCommission(@request() req: Request) {
    const { commission_id } = req.params;
    const { tax, tax_type } = req.body;

    const [error] = await this.company_service.updateCommission({
      commission_id,
      tax,
      tax_type
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpGet('/:company_id/commissions/:commission_id')
  async getCommission(@request() req: Request) {
    const { commission_id } = req.params;

    const [error, data] = await this.company_service.getCommission({
      commission_id
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.json(data, HttpStatusCodes.OK);
  }
}
