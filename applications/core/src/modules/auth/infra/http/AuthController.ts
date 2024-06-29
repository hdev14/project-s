import AuthService from "@auth/app/AuthService";
import CredentialError from "@shared/errors/CredentialError";
import NotFoundError from "@shared/errors/NotFoundError";
import HttpStatusCodes from "@shared/infra/HttpStatusCodes";
import { requestValidator } from "@shared/infra/middlewares";
import types from "@shared/infra/types";
import { Request, Response } from 'express';
import { inject } from "inversify";
import {
  BaseHttpController,
  controller,
  httpGet,
  httpPatch,
  httpPost,
  httpPut,
  request,
  response
} from "inversify-express-utils";
import {
  create_user_validation_schema,
  login_validation_schema,
  update_policies_validation_schema,
  update_user_validation_schema
} from "./validations";

@controller('/api/auth')
export default class AuthController extends BaseHttpController {
  constructor(@inject(types.AuthService) readonly auth_service: AuthService) {
    super();
  }

  @httpPost('/login', requestValidator(login_validation_schema))
  async login(@request() req: Request, @response() res: Response) {
    const { email, password } = req.body;

    const [data, error] = await this.auth_service.login({
      email,
      password,
    });

    if (error instanceof CredentialError) {
      return this.json({ message: error.message }, HttpStatusCodes.BAD_REQUEST);
    }

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('AT', data!.auth.token, {
      httpOnly: isProd,
      sameSite: isProd,
      secure: isProd,
      domain: isProd ? process.env.DOMAIN : '',
      expires: data!.auth.expired_at,
    });

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpGet('/users', types.AuthMiddleware)
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

  @httpPut(
    '/users/:id',
    types.AuthMiddleware,
    requestValidator(update_user_validation_schema)
  )
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

  @httpPatch(
    '/users/:id/policies',
    types.AuthMiddleware,
    requestValidator(update_policies_validation_schema)
  )
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