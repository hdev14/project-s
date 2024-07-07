import VerificationCode from "@auth/domain/VerificationCode";

export default interface VerificationCodeRepository {
  getVerificationCodeByCode(code: string): Promise<VerificationCode | null>;
  createVerificationCode(verification_code: VerificationCode): Promise<void>;
  updateVerificationCode(verification_code: VerificationCode): Promise<void>;
}