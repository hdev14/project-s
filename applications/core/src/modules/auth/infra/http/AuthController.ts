import AuthService from "@auth/app/AuthService";
import HttpStatusCodes from "@shared/HttpStatusCodes";
import NotFoundError from "@shared/errors/NotFoundError";
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
  request,
  requestParam
} from "inversify-express-utils";

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
  async getUsers() {
    return this.ok();
  }

  @httpPost('/users')
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

  @httpPut('/users/:id')
  async updateUser(@requestParam('id') id: string) {
    console.log(id);
    return this.ok();
  }

  @httpPatch('/users/:id/policies')
  async updatePolicies(@requestParam('id') id: string) {
    console.log(id);
    return this.ok();
  }
}