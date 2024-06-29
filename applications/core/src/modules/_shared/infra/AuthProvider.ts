/* eslint-disable @typescript-eslint/no-unused-vars */
import AuthTokenManager from "@auth/app/AuthTokenManager";
import { UserObject } from "@auth/domain/User";
import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { interfaces } from "inversify-express-utils";
import types from "./types";

export class Principal implements interfaces.Principal {
  details: UserObject | null;

  constructor(user: UserObject | null) {
    this.details = user;
  }

  isAuthenticated(): Promise<boolean> {
    return Promise.resolve(this.details !== null);
  }

  isResourceOwner(resourceId: any): Promise<boolean> {
    if (this.details !== null) {
      return Promise.resolve(this.details.id === resourceId);
    }

    return Promise.resolve(false);
  }

  isInRole(role: string): Promise<boolean> {
    if (this.details !== null) {
      let has_role = false;

      for (let idx = 0; idx < this.details.policies.length; idx++) {
        const policy = this.details.policies[idx];
        if (policy === role) {
          has_role = true;
          break;
        }
      }

      return Promise.resolve(has_role);
    }

    return Promise.resolve(false);
  }
}

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

    const payload = this.auth_token_manager.verifyToken(token) as UserObject;

    return Promise.resolve(new Principal(payload));
  }
}