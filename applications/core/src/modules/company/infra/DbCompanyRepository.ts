import { PageOptions } from "@shared/utils/Pagination";
import CompanyRepository from "../app/CompanyRepository";
import Company from "../domain/Company";

export default class DbCompanyRepository implements CompanyRepository {
  createCompany(company: Company): Promise<void> {
    throw new Error("Method not implemented.");
  }
  updateCompany(company: Company): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getCompanyById(id: string): Promise<Company> {
    throw new Error("Method not implemented.");
  }
  getCompanies(pagination: PageOptions): Promise<Company[]> {
    throw new Error("Method not implemented.");
  }
}