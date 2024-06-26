import { PageOptions } from "@shared/utils/Pagination";
import Company from "../domain/Company";

export default interface CompanyRepository {
  createCompany(company: Company): Promise<void>;
  updateCompany(company: Company): Promise<void>;
  getCompanyById(id: string): Promise<Company>;
  getCompanies(pagination: PageOptions): Promise<Array<Company>>;
}