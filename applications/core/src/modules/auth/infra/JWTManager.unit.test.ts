import { faker } from '@faker-js/faker/locale/pt_BR';
import jwt from 'jsonwebtoken';
import JWTManager from "./JWTManager";

jest.mock('jsonwebtoken');

const jwt_mocked = jest.mocked(jwt);

describe('JWTManager unit tests', () => {
  const token_manager = new JWTManager();
  const OLD_ENV = process.env;

  beforeAll(() => {
    process.env = {
      ...OLD_ENV,
      JWT_PRIVATE_SECRET: 'test_secret',
    };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('JWTManager.generateToken', () => {
    it('should generate a token result with token and expired_at', () => {
      const payload = {
        id: faker.string.uuid(),
      };

      jwt_mocked.sign.mockReturnValueOnce('test' as never);

      const result = token_manager.generateToken(payload);

      expect(jwt_mocked.sign).toHaveBeenCalledWith(payload, 'test_secret', {
        expiresIn: '1h'
      });
      expect(result.token).toEqual('test');
      expect(result.expired_at).toBeInstanceOf(Date);
    });
  });

  describe('JWTManager.verifyToken', () => {
    it('returns the payload information', () => {
      const fake_data = {
        id: faker.string.uuid(),
      };

      jwt_mocked.verify.mockReturnValueOnce(fake_data as never);

      const token = faker.string.alphanumeric();
      const payload = token_manager.verifyToken(token);

      expect(jwt_mocked.verify).toHaveBeenCalledWith(token, 'test_secret');
      expect(payload).toEqual(fake_data);
    });

    it('returns null if token expired', () => {
      jwt_mocked.verify.mockImplementationOnce(() => {
        throw new jwt.TokenExpiredError('test', new Date());
      });

      const payload = token_manager.verifyToken(faker.string.alphanumeric());

      expect(payload).toBeNull();
    });

    it('returns null if token is invalid', () => {
      jwt_mocked.verify.mockImplementationOnce(() => {
        throw new jwt.JsonWebTokenError('test');
      });

      const payload = token_manager.verifyToken(faker.string.alphanumeric());

      expect(payload).toBeNull();
    });
  });

  describe('JWTManager.refreshToken', () => {
    it('returns with the existing payload a new token result', () => {
      const fake_payload = {
        id: faker.string.uuid(),
      };

      jwt_mocked.decode.mockReturnValueOnce(fake_payload);
      jwt_mocked.sign.mockReturnValueOnce('test' as never);

      const token = faker.string.alphanumeric();
      const result = token_manager.refreshToken(token);

      expect(result.token).toBeDefined();
      expect(result.expired_at).toBeInstanceOf(Date);
      expect(jwt_mocked.decode).toHaveBeenCalledWith(token);
      expect(jwt_mocked.sign).toHaveBeenCalledWith(fake_payload, 'test_secret', {
        expiresIn: '1h'
      });
    });
  });
});