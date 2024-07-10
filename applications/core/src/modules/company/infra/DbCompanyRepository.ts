import Database from "@shared/infra/Database";
import Collection from "@shared/utils/Collection";
import DbUtils from "@shared/utils/DbUtils";
import Pagination, { PaginatedResult } from "@shared/utils/Pagination";
import { Pool } from "pg";
import CompanyRepository, { CompaniesFilter } from "../app/CompanyRepository";
import Company, { CompanyObject } from "../domain/Company";

export default class DbCompanyRepository implements CompanyRepository {
  #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  async getCompanies(filter?: CompaniesFilter): Promise<PaginatedResult<Company>> {
    const { rows: company_rows, page_result } = await this.selectCompanies(filter);

    const company_ids = [];

    for (let idx = 0; idx < company_rows.length; idx++) {
      company_ids.push(company_rows[idx].id);
    }

    const { rows: employee_rows } = await this.#db.query(`SELECT * FROM users WHERE tenant_id ${DbUtils.inOperator(company_ids)}`, company_ids);

    const companies = [];

    for (let idx = 0; idx < company_rows.length; idx++) {
      const company = company_rows[idx];

      const company_obj: CompanyObject = {
        id: company.id,
        document: company.document,
        name: company.name,
        access_plan_id: company.access_plan_id,
        bank: {
          account: company.account,
          account_digit: company.account_digit,
          agency: company.agency,
          agency_digit: company.agency_digit,
          bank_code: company.bank_code,
        },
        address: {
          district: company.district,
          street: company.street,
          number: company.number,
          state: company.state,
          complement: company.complement,
        },
        brand: {
          color: company.color,
          logo_url: company.logo_url,
        },
        employees: []
      };

      for (let j = 0; j < employee_rows.length; j++) {
        const employee = employee_rows[j];

        if (employee.tenant_id === company.id) {
          company_obj.employees.push({
            id: employee.id,
            document: employee.document,
            email: employee.email,
            name: employee.name,
          });
        }
      }

      companies.push(new Company(company_obj));
    }

    return { results: new Collection(companies), page_result };
  }

  private async selectCompanies(filter?: CompaniesFilter) {
    const query = 'SELECT * FROM users WHERE tenant_id IS NULL AND is_admin = false';

    if (filter && filter.page_options) {
      const count_query = 'SELECT count(id) as total FROM users WHERE tenant_id IS NULL AND is_admin = false';
      const offset = Pagination.calculateOffset(filter.page_options);
      const total_result = await this.#db.query(count_query);

      const paginated_query = `${query} LIMIT $1 OFFSET $2`;

      const result = await this.#db.query(paginated_query, [filter.page_options.limit, offset]);

      const page_result = (total_result.rows[0].total !== undefined && total_result.rows[0].total > 0)
        ? Pagination.calculatePageResult(total_result.rows[0].total, filter!.page_options!)
        : undefined;

      return { rows: result.rows, page_result };
    }

    const { rows } = await this.#db.query(query);

    return { rows };
  }

  createCompany(company: Company): Promise<void> {
    throw new Error("Method not implemented.");
  }

  updateCompany(company: Company): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getCompanyById(id: string): Promise<Company> {
    throw new Error("Method not implemented.");
  }
}