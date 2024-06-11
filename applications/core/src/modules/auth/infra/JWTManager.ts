import AuthTokenManager, { TokenResult } from "@auth/app/AuthTokenManager";

export default class JWTManager implements AuthTokenManager {
  generateToken(payload: Record<string, any>): TokenResult {
    throw new Error("Method not implemented.");
  }
  verifyToken<T = Record<string, any>>(token: string): T {
    throw new Error("Method not implemented.");
  }
  refreshToken(token: string): TokenResult {
    throw new Error("Method not implemented.");
  }
}