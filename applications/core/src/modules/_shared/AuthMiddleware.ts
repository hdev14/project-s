import { NextFunction, Request, Response } from "express";
import { injectable } from "inversify";
import { BaseMiddleware } from "inversify-express-utils";
import HttpStatusCodes from "./HttpStatusCodes";

@injectable()
export default class AuthMiddleware extends BaseMiddleware {
  async handler(_req: Request, res: Response, next: NextFunction) {
    if (await this.httpContext.user.isAuthenticated()) {
      return next();
    }

    res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
  }
}
