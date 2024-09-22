import CatalogService from "@catalog/app/CatalogService";
import Logger from "@global/app/Logger";
import DomainError from "@shared/errors/DomainError";
import NotFoundError from "@shared/errors/NotFoundError";
import HttpStatusCodes from "@shared/HttpStatusCodes";
import { deleteFiles, requestValidator, upload } from "@shared/middlewares";
import { Policies } from "@shared/Principal";
import types from "@shared/types";
import { Request } from 'express';
import { readFile } from "fs/promises";
import { inject } from "inversify";
import {
  BaseHttpController,
  controller,
  httpGet,
  httpPost,
  httpPut,
  request
} from "inversify-express-utils";
import { create_catalog_item_validation_schema, update_catalog_item_validation_schema } from "./validations";

@controller('/api/catalogs', types.AuthMiddleware)
export default class CatalogController extends BaseHttpController {
  constructor(
    @inject(types.CatalogService) readonly catalog_service: CatalogService,
    @inject(types.Logger) readonly logger: Logger,
  ) {
    super();
    this.logger.info("Catalog's APIs enabled");
  }

  @httpPost(
    '/items',
    upload.single('picture_file'),
    requestValidator(create_catalog_item_validation_schema),
    deleteFiles()
  )
  async createCatalogItem(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.CREATE_CATALOG_ITEM)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const {
      name,
      description,
      is_service,
      tenant_id,
      amount,
    } = req.body;

    const [error, data] = await this.catalog_service.createCatalogItem({
      name,
      description,
      attributes: this.parseAttributes(req.body.attributes),
      is_service: is_service === 'true',
      tenant_id,
      picture_file: req.file && await readFile(req.file.path),
      amount: parseFloat(amount)
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
    '/items/:id',
    upload.single('picture_file'),
    requestValidator(update_catalog_item_validation_schema),
    deleteFiles(),
  )
  async updateCatalogItem(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.UPDATE_CATALOG_ITEM)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const { id: catalog_item_id } = req.params;
    const { name, description } = req.body;

    const [error] = await this.catalog_service.updateCatalogItem({
      catalog_item_id,
      name,
      attributes: req.body.attributes ? this.parseAttributes(req.body.attributes) : undefined,
      description,
      picture_file: req.file && await readFile(req.file.path),
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  private parseAttributes(attributes: string[]) {
    const result = [];

    for (let idx = 0; idx < attributes.length; idx++) {
      result.push(JSON.parse(attributes[idx]));
    }

    return result;
  }

  @httpGet('/items')
  async getCatalogItems(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.LIST_CATALOG_ITEMS)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const { page, limit, tenant_id } = req.query;
    const params = (page && limit) ? ({
      tenant_id: tenant_id as string,
      page_options: {
        limit: parseInt(limit.toString(), 10),
        page: parseInt(page.toString(), 10)
      }
    }) : ({ tenant_id: tenant_id as string });

    const [, data] = await this.catalog_service.getCatalogItems(params);

    return this.json(data, HttpStatusCodes.OK);
  }
}
