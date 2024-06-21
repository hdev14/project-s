import AuthService from "@auth/app/AuthService";
import { inject } from "inversify";
import { BaseHttpController, controller, httpGet, httpPatch, httpPost, httpPut, requestParam } from "inversify-express-utils";
import types from "../types";

@controller('/api/auth')
export default class AuthController extends BaseHttpController {
  constructor(
    @inject(types.AuthService) readonly auth_service: AuthService
  ) {
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
  async registerUser() {
    return this.ok();
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