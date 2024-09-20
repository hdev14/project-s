import VerificationCode from "@auth/domain/VerificationCode";
import DbVerificationCodeRepository from "@auth/infra/persistence/DbVerificationCodeRepository";
import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/Database";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbVerificationCodeRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbVerificationCodeRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  describe('DbVerificationCodeRepository.getVerficiationCodeByCode', () => {
    it('returns a verification code', async () => {
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: faker.string.uuid(),
            code: faker.string.alphanumeric(),
            expired_at: faker.date.future(),
            user_id: faker.string.uuid(),
          },
        ]
      });

      const code = faker.string.alphanumeric();
      const verification_code = await repository.getVerificationCodeByCode(code);

      expect(verification_code).toBeInstanceOf(VerificationCode);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM verification_codes WHERE code = $1',
        [code]
      );
    });

    it('returns null if verification code was not found', async () => {
      query_mock.mockResolvedValueOnce({
        rows: []
      });

      const code = faker.string.alphanumeric();
      const verification_code = await repository.getVerificationCodeByCode(code);

      expect(verification_code).toBeNull();
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM verification_codes WHERE code = $1',
        [code]
      );
    });
  });

  describe('DbVerificationCodeRepository.createVerificationCode', () => {
    it('creates a verification code', async () => {
      const verification_code_props = {
        id: faker.string.uuid(),
        code: faker.string.alphanumeric(),
        user_id: faker.string.uuid(),
        expired_at: faker.date.future(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      };

      const verification_code = new VerificationCode(verification_code_props);

      await repository.createVerificationCode(verification_code);

      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO verification_codes (id,code,user_id,expired_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6)',
        [
          verification_code_props.id,
          verification_code_props.code,
          verification_code_props.user_id,
          verification_code_props.expired_at,
          verification_code_props.created_at,
          verification_code_props.updated_at,
        ],
      );
    });
  });

  describe('DbVerificationCodeRepository.updateVerificationCode', () => {
    it('updates a verification code', async () => {
      const verification_code_props = {
        id: faker.string.uuid(),
        code: faker.string.alphanumeric(),
        user_id: faker.string.uuid(),
        expired_at: faker.date.future(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      };

      const verification_code = new VerificationCode(verification_code_props);

      await repository.updateVerificationCode(verification_code);

      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE verification_codes SET code=$2,user_id=$3,expired_at=$4,updated_at=$5 WHERE id = $1',
        [
          verification_code_props.id,
          verification_code_props.code,
          verification_code_props.user_id,
          verification_code_props.expired_at,
          verification_code_props.updated_at
        ],
      );
    });
  });
});
