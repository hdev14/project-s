import AuthTokenManager, { TokenResult } from "@auth/app/AuthTokenManager";
import { injectable } from "inversify";
import jwt from 'jsonwebtoken';
import 'reflect-metadata';

@injectable()
export default class JWTManager implements AuthTokenManager {
  static TOKEN_HOURS = 1;

  generateToken(payload: Record<string, unknown>): TokenResult {
    const token = jwt.sign(payload, process.env.JWT_PRIVATE_SECRET!, {
      expiresIn: `${JWTManager.TOKEN_HOURS}h`,
    });

    const expired_at = new Date();
    expired_at.setHours(expired_at.getHours() + JWTManager.TOKEN_HOURS);

    return { token, expired_at };
  }

  verifyToken<T = Record<string, unknown>>(token: string): T | null {
    try {
      const payload = jwt.verify(token, process.env.JWT_PRIVATE_SECRET!);

      return payload as T;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
        return null;
      }

      throw error;
    }
  }

  refreshToken(token: string): TokenResult {
    const payload = jwt.decode(token) as Record<string, unknown>;
    return this.generateToken(payload);
  }
}