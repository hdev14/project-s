import PaginationOptions from "@share/utils/PaginationOptions";
import Company from "../domain/Company";

export default interface CompanyRepository {
  createCompany(company: Company): Promise<void>;
  updateCompany(company: Company): Promise<void>;
  getCompanyById(id: string): Promise<Company>;
  getCompanies(pagination: PaginationOptions): Promise<Array<Company>>;
}