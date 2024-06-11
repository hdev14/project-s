export type TokenResult = {
  token: string;
  expired_at: Date;
}

export default interface AuthTokenManager {
  generateToken(payload: Record<string, any>): TokenResult;
  verifyToken<T = Record<string, any>>(token: string): T;
  refreshToken(token: string): TokenResult;
}