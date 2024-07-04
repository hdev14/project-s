import CatalogService from "@catalog/app/CatalogService";
import NotFoundError from "@shared/errors/NotFoundError";
import HttpStatusCodes from "@shared/infra/HttpStatusCodes";
import { requestValidator } from "@shared/infra/middlewares";
import types from "@shared/infra/types";
import { Request } from 'express';
import { inject } from "inversify";
import {
  BaseHttpController,
  controller,
  httpGet,
  httpPost,
  httpPut,
  request
} from "inversify-express-utils";
import { create_catalog_item_validation_schema } from "./validations";

@controller('/api/catalog', types.AuthMiddleware)
export default class CatalogController extends BaseHttpController {
  constructor(@inject(types.CatalogService) readonly catalog_service: CatalogService) {
    super();
  }

  @httpPost('/items', requestValidator(create_catalog_item_validation_schema))
  async createCatalogItem(@request() req: Request) {
    const {
      name,
      description,
      attributes,
      is_service = false,
      tenant_id,
      picture_url
    } = req.body;

    const [data, error] = await this.catalog_service.createCatalogItem({
      name,
      description,
      attributes,
      is_service,
      tenant_id,
      picture_url
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: error.message }, HttpStatusCodes.NOT_FOUND);
    }

    return this.json(data, HttpStatusCodes.CREATED);
  }

  @httpPut('/items/:id')
  async updateCatalogItem(@request() req: Request) {
    return this.ok();
  }

  @httpGet('/items')
  async getCatalogItems(@request() req: Request) {
    const { page, limit, tenant_id } = req.query;
    const params = (page && limit) ? ({
      tenant_id: tenant_id as string,
      page_options: {
        limit: parseInt(limit.toString(), 10),
        page: parseInt(page.toString(), 10)
      }
    }) : ({ tenant_id: tenant_id as string });

    const [data] = await this.catalog_service.getCatalogItems(params);

    return this.json(data, HttpStatusCodes.OK);
  }
}