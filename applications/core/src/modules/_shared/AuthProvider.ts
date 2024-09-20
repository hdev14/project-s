/* eslint-disable @typescript-eslint/no-unused-vars */
import AuthTokenManager from "@auth/app/AuthTokenManager";
import { UserProps } from "@auth/domain/User";
import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { interfaces } from "inversify-express-utils";
import { Principal } from "./Principal";
import types from "./types";

@injectable()
export default class AuthProvider implements interfaces.AuthProvider {
  @inject(types.AuthTokenManager)
  private readonly auth_token_manager!: AuthTokenManager;

  getUser(req: Request, _res: Response, _next: NextFunction): Promise<interfaces.Principal> {
    const header = req.get('Authorization') || '';
    const [, headerToken] = header.split(' ');
    const cookieToken = req.cookies ? req.cookies['AT'] : null;

    const token = cookieToken || headerToken;

    if (!token) {
      return Promise.resolve(new Principal(null));
    }

    const payload = this.auth_token_manager.verifyToken(token) as UserProps;

    return Promise.resolve(new Principal(payload));
  }
}
