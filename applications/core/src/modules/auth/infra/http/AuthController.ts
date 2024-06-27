import AuthService from "@auth/app/AuthService";
import HttpStatusCodes from "@shared/HttpStatusCodes";
import NotFoundError from "@shared/errors/NotFoundError";
import { requestValidator } from "@shared/middlewares";
import types from "@shared/types";
import { Request } from 'express';
import { inject } from "inversify";
import {
  BaseHttpController,
  controller,
  httpGet,
  httpPatch,
  httpPost,
  httpPut,
  request
} from "inversify-express-utils";
import { create_user_validation_schema, update_policies_validation_schema, update_user_validation_schema } from "./validations";

@controller('/api/auth')
export default class AuthController extends BaseHttpController {
  constructor(@inject(types.AuthService) readonly auth_service: AuthService) {
    super();
  }

  @httpPost('/login')
  async login() {
    return this.ok();
  }

  @httpGet('/users')
  async getUsers(@request() req: Request) {
    const { page, limit } = req.query;
    const params = (page && limit) ? ({
      pagination: {
        limit: parseInt(limit.toString(), 10),
        page: parseInt(page.toString(), 10)
      }
    }) : ({});

    const [data] = await this.auth_service.getUsers(params);

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpPost('/users', requestValidator(create_user_validation_schema))
  async registerUser(@request() req: Request) {
    const { email, password, access_plan_id } = req.body;

    const [data, error] = await this.auth_service.registerUser({
      email,
      password,
      access_plan_id
    });

    if (error) {
      if (error instanceof NotFoundError) {
        return this.json({ message: error.message }, HttpStatusCodes.NOT_FOUND);
      }
      return this.json({ message: error.message }, HttpStatusCodes.UNPROCESSABLE_CONTENT);
    }


    return this.json(data, HttpStatusCodes.CREATED);
  }

  @httpPut('/users/:id', requestValidator(update_user_validation_schema))
  async updateUser(@request() req: Request) {
    const { email, password } = req.body;

    const [, error] = await this.auth_service.updateUser({
      user_id: req.params.id,
      email,
      password,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: error.message }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpPatch('/users/:id/policies', requestValidator(update_policies_validation_schema))
  async updatePolicies(@request() req: Request) {
    const { id } = req.params;
    const { policy_slugs, mode } = req.body;

    const [, error] = await this.auth_service.updatePolicies({
      mode,
      policy_slugs,
      user_id: id,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: error.message }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }
}