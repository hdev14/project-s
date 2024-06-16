import Either from "@shared/utils/Either";
import { CompanyObject } from "../domain/Company";

export default class CompanyService {
  async createCompany(params: {}): Promise<Either<CompanyObject>> {
    return Either.left(new Error());
  }

  async getCompanies(params: {}): Promise<Either<Array<CompanyObject>>> {
    return Either.left(new Error());
  }
}