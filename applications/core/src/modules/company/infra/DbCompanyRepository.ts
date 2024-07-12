import Database from "@shared/infra/Database";
import Collection from "@shared/utils/Collection";
import DbUtils from "@shared/utils/DbUtils";
import Pagination, { PaginatedResult } from "@shared/utils/Pagination";
import { Pool } from "pg";
import CompanyRepository, { CompaniesFilter } from "../app/CompanyRepository";
import Company, { CompanyObject } from "../domain/Company";

export default class DbCompanyRepository implements CompanyRepository {
  #db: Pool;
  #select_companies_query = 'SELECT * FROM users WHERE tenant_id IS NULL AND is_admin = false';

  constructor() {
    this.#db = Database.connect();
  }

  async getCompanies(filter?: CompaniesFilter): Promise<PaginatedResult<Company>> {
    const { rows: company_rows, page_result } = await this.selectCompanies(filter);

    const company_ids = [];

    for (let idx = 0; idx < company_rows.length; idx++) {
      company_ids.push(company_rows[idx].id);
    }

    const { rows: employee_rows } = await this.#db.query(
      `SELECT * FROM users WHERE tenant_id ${DbUtils.inOperator(company_ids)}`,
      company_ids
    );

    const companies = [];

    for (let idx = 0; idx < company_rows.length; idx++) {
      companies.push(this.mapCompany(company_rows[idx], employee_rows));
    }

    return { results: new Collection(companies), page_result };
  }

  private async selectCompanies(filter?: CompaniesFilter) {
    if (filter && filter.page_options) {
      const count_query = 'SELECT count(id) as total FROM users WHERE tenant_id IS NULL AND is_admin = false';
      const offset = Pagination.calculateOffset(filter.page_options);
      const count_result = await this.#db.query(count_query);

      const paginated_query = `${this.#select_companies_query} LIMIT $1 OFFSET $2`;

      const result = await this.#db.query(paginated_query, [filter.page_options.limit, offset]);

      const page_result = (count_result.rows[0].total !== undefined && count_result.rows[0].total > 0)
        ? Pagination.calculatePageResult(count_result.rows[0].total, filter!.page_options!)
        : undefined;

      return { rows: result.rows, page_result };
    }

    const { rows } = await this.#db.query(this.#select_companies_query);

    return { rows };
  }

  async updateCompany(company: Company): Promise<void> {
    const { id, document, name, address, bank, brand, access_plan_id } = company.toObject();
    const data = Object.assign({}, { id, document, name, access_plan_id }, address, bank, brand);

    await this.#db.query(
      `UPDATE users SET ${DbUtils.setColumns(data)} WHERE id = $1`,
      DbUtils.sanitizeValues(Object.values(data))
    );
  }

  async getCompanyById(id: string): Promise<Company | null> {
    const { rows: company_rows } = await this.#db.query(`${this.#select_companies_query} AND id = $1`, [id]);

    if (company_rows.length === 0) {
      return null;
    }

    const { rows: employee_rows } = await this.#db.query(`SELECT * FROM users WHERE tenant_id = $1`, [id]);

    return this.mapCompany(company_rows[0], employee_rows)
  }

  private mapCompany(company: any, employee_rows: any[]) {
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

    for (let idx = 0; idx < employee_rows.length; idx++) {
      const employee = employee_rows[idx];

      if (employee.tenant_id === company.id) {
        company_obj.employees.push({
          id: employee.id,
          document: employee.document,
          email: employee.email,
          name: employee.name,
        });
      }
    }

    return new Company(company_obj);
  }
}