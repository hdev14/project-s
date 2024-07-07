import VerificationCodeRepository from "@auth/app/VerificationCodeRepository";
import VerificationCode from "@auth/domain/VerificationCode";
import Database from "@shared/infra/Database";
import DbUtils from "@shared/utils/DbUtils";
import { Pool } from "pg";

export default class DbVerificationCodeRepository implements VerificationCodeRepository {
  #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  async getVerificationCodeByCode(code: string): Promise<VerificationCode | null> {
    const result = await this.#db.query('SELECT * FROM verification_codes WHERE expired_at > NOW() AND code = $1', [code]);

    if (result.rows.length === 0) {
      return null;
    }

    return new VerificationCode({
      id: result.rows[0].id,
      code: result.rows[0].code,
      user_id: result.rows[0].user_id,
      expired_at: result.rows[0].expired_at,
    });
  }

  async createVerificationCode(verification_code: VerificationCode): Promise<void> {
    const verification_code_obj = verification_code.toObject();

    const values = Object.values(verification_code_obj)

    const query = `INSERT INTO verification_codes ${DbUtils.columns(verification_code_obj)} VALUES ${DbUtils.values(values)}`;

    await this.#db.query(query, DbUtils.sanitizeValues(values));
  }

  async updateVerificationCode(verification_code: VerificationCode): Promise<void> {
    const verification_code_obj = verification_code.toObject();

    const query = `UPDATE verification_codes SET ${DbUtils.setColumns(verification_code_obj)} WHERE id = $1`;

    await this.#db.query(query, DbUtils.sanitizeValues(Object.values(verification_code_obj)));
  }
}