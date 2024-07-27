import Employee from "@company/domain/Employee";
import { PageOptions, PaginatedResult } from "@shared/utils/Pagination";
import Company from "../domain/Company";

export type CompaniesFilter = {
  page_options?: PageOptions;
};

export default interface CompanyRepository {
  updateCompany(company: Company): Promise<void>;
  getCompanyById(id: string): Promise<Company | null>;
  documentExists(document: string): Promise<boolean>;
  getCompanies(filter?: CompaniesFilter): Promise<PaginatedResult<Company>>;
  updateEmployee(employee: Employee): Promise<void>;
  getEmployeeById(id: string): Promise<Employee | null>;
}