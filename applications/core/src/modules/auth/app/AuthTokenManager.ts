export type TokenResult = {
  token: string;
  expired_at: Date;
}

export default interface AuthTokenManager {
  generateToken(payload: Record<string, unknown>): TokenResult;
  verifyToken<T = Record<string, unknown>>(token: string): T | null;
  refreshToken(token: string): TokenResult;
}