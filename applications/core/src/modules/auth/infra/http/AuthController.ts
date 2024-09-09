import AuthService from "@auth/app/AuthService";
import Logger from "@global/app/Logger";
import CredentialError from "@shared/errors/CredentialError";
import DomainError from "@shared/errors/DomainError";
import ExpiredCodeError from "@shared/errors/ExpiredCode";
import NotFoundError from "@shared/errors/NotFoundError";
import HttpStatusCodes from "@shared/HttpStatusCodes";
import { requestValidator } from "@shared/middlewares";
import { Policies } from "@shared/Principal";
import types from "@shared/types";
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
  create_access_plan_validation_schema,
  create_user_validation_schema,
  forgot_password_validation_schema,
  login_validation_schema,
  reset_password_validation_schema,
  update_access_plan_validation_schema,
  update_policies_validation_schema,
  update_user_validation_schema
} from "./validations";

@controller('/api/auth')
export default class AuthController extends BaseHttpController {
  constructor(
    @inject(types.AuthService) readonly auth_service: AuthService,
    @inject(types.Logger) readonly logger: Logger,
  ) {
    super();
    this.logger.info("Auth's APIs enabled");
  }

  @httpPost('/login', requestValidator(login_validation_schema))
  async login(@request() req: Request, @response() res: Response) {
    const { email, password } = req.body;

    const [error, data] = await this.auth_service.login({
      email,
      password,
    });

    if (error instanceof CredentialError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.BAD_REQUEST);
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
    if (!await this.httpContext.user.isInRole(Policies.LIST_USERS)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const { page, limit, tenant_id } = req.query;

    const params: Record<string, any> = {};

    if (page && limit) {
      params['page_options'] = {
        limit: parseInt(limit.toString(), 10),
        page: parseInt(page.toString(), 10)
      }
    }

    if (tenant_id) {
      params['tenant_id'] = tenant_id;
    }

    const [, data] = await this.auth_service.getUsers(params);

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpPost('/users', requestValidator(create_user_validation_schema))
  async registerUser(@request() req: Request) {
    const { email, password, access_plan_id, tenant_id, type } = req.body;

    if (tenant_id !== undefined && !await this.httpContext.user.isInRole(Policies.CREATE_TENANT_USER)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const [error, data] = await this.auth_service.registerUser({
      email,
      password,
      access_plan_id,
      tenant_id,
      type,
    });

    if (error) {
      if (error instanceof NotFoundError) {
        return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
      }
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.UNPROCESSABLE_CONTENT);
    }


    return this.json(data, HttpStatusCodes.CREATED);
  }

  @httpPut(
    '/users/:id',
    types.AuthMiddleware,
    requestValidator(update_user_validation_schema)
  )
  async updateUser(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.UPDATE_USER)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const { email, password } = req.body;

    const [error] = await this.auth_service.updateUser({
      user_id: req.params.id,
      email,
      password,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpPatch(
    '/users/:id/policies',
    types.AuthMiddleware,
    requestValidator(update_policies_validation_schema)
  )
  async updatePolicies(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.UPDATE_USER_POLICIES)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const { id } = req.params;
    const { policy_slugs, mode } = req.body;

    const [error] = await this.auth_service.updatePolicies({
      mode,
      policy_slugs,
      user_id: id,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpPost(
    '/access_plans',
    types.AuthMiddleware,
    requestValidator(create_access_plan_validation_schema)
  )
  async createAccessPlan(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.CREATE_ACCESS_PLAN)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const { amount, type, description } = req.body;

    const [error, data] = await this.auth_service.createAccessPlan({
      amount,
      type,
      description,
    });

    if (error instanceof DomainError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.UNPROCESSABLE_CONTENT);
    }

    return this.json(data, HttpStatusCodes.CREATED);
  }

  @httpPut(
    '/access_plans/:id',
    types.AuthMiddleware,
    requestValidator(update_access_plan_validation_schema)
  )
  async updateAccessPlan(@request() req: Request) {
    if (!await this.httpContext.user.isInRole(Policies.UPDATE_ACCESS_PLAN)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const { id: access_plan_id } = req.params;
    const {
      active,
      amount,
      description,
      type
    } = req.body;

    const [error] = await this.auth_service.updateAccessPlan({
      access_plan_id,
      active,
      amount,
      description,
      type
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpGet('/access_plans', types.AuthMiddleware)
  async getAccessPlans() {
    if (!await this.httpContext.user.isInRole(Policies.LIST_ACCESS_PLANS)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const [, data] = await this.auth_service.getAccessPlans();

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpGet('/policies', types.AuthMiddleware)
  async getPolicies() {
    if (!await this.httpContext.user.isInRole(Policies.LIST_POLICIES)) {
      return this.statusCode(HttpStatusCodes.FORBIDDEN);
    }

    const [, data] = await this.auth_service.getPolicies();

    return this.json(data, HttpStatusCodes.OK);
  }

  @httpPost('/passwords', requestValidator(forgot_password_validation_schema))
  async forgotPassword(@request() req: Request) {
    const { email } = req.body;


    const [error] = await this.auth_service.forgotPassword({ email });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }

  @httpPatch('/passwords', requestValidator(reset_password_validation_schema))
  async resetPassword(@request() req: Request) {
    const { code, password } = req.body;
    const [error] = await this.auth_service.resetPassword({
      code,
      password,
    });

    if (error instanceof NotFoundError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.NOT_FOUND);
    }

    if (error instanceof ExpiredCodeError) {
      return this.json({ message: req.__(error.message) }, HttpStatusCodes.BAD_REQUEST)
    }

    return this.statusCode(HttpStatusCodes.NO_CONTENT);
  }
}
