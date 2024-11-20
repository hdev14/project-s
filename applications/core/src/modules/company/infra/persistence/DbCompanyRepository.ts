import Employee from "@company/domain/Employee";
import DefaultRepository from "@shared/DefaultRepository";
import DbUtils from "@shared/utils/DbUtils";
import { PaginatedResult } from "@shared/utils/Pagination";
import { injectable } from "inversify";
import 'reflect-metadata';
import CompanyRepository, { CompaniesFilter } from "../../app/CompanyRepository";
import Company, { CompanyProps } from "../../domain/Company";

@injectable()
export default class DbCompanyRepository extends DefaultRepository implements CompanyRepository {
  #select_companies_query = "SELECT * FROM users WHERE type='company'";
  #count_query = "SELECT count(id) as total FROM users WHERE type='company'";

  async getEmployeeById(id: string): Promise<Employee | null> {
    const result = await this.db.query(
      "SELECT * FROM users WHERE type='employee' AND id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return Employee.fromObject({
      id: result.rows[0].id,
      name: result.rows[0].name,
      document: result.rows[0].document,
      email: result.rows[0].email,
      deactivated_at: result.rows[0].deactivated_at && new Date(result.rows[0].deactivated_at),
      created_at: new Date(result.rows[0].created_at),
      updated_at: new Date(result.rows[0].updated_at),
    });
  }

  async updateEmployee(employee: Employee): Promise<void> {
    const data = Object.assign({}, employee.toObject(), { created_at: undefined });
    await this.db.query(
      `UPDATE users SET ${DbUtils.setColumns(data)} WHERE type='employee' AND id = $1`,
      DbUtils.sanitizeValues(Object.values(data))
    );
  }

  async documentExists(document: string): Promise<boolean> {
    const result = await this.db.query(`${this.#count_query} AND document = $1`, [document]);

    return Boolean(parseInt(result.rows[0].total));
  }

  async getCompanies(filter?: CompaniesFilter): Promise<PaginatedResult<CompanyProps>> {
    const { rows: company_rows, page_result } = await this.selectCompanies(filter);

    const company_ids = [];

    for (let idx = 0; idx < company_rows.length; idx++) {
      company_ids.push(company_rows[idx].id);
    }

    const { rows: employee_rows } = await this.db.query(
      `SELECT * FROM users WHERE tenant_id ${DbUtils.inOperator(company_ids)}`,
      company_ids
    );

    const results = [];

    for (let idx = 0; idx < company_rows.length; idx++) {
      results.push(this.mapCompany(company_rows[idx], employee_rows));
    }

    return { results, page_result };
  }

  private async selectCompanies(filter?: CompaniesFilter) {
    if (filter && filter.page_options) {
      return this.getRowsPaginated({
        main_query: this.#select_companies_query,
        count_query: this.#count_query,
        page_options: filter.page_options,
      });
    }

    const { rows } = await this.db.query(this.#select_companies_query);

    return { rows, page_result: undefined };
  }

  async updateCompany(company: Company): Promise<void> {
    const { id, document, name, address, bank, brand, access_plan_id } = company.toObject();
    const data = Object.assign({}, { id, document, name, access_plan_id }, address, bank, brand);

    await this.db.query(
      `UPDATE users SET ${DbUtils.setColumns(data)} WHERE type='company' AND id = $1`,
      DbUtils.sanitizeValues(Object.values(data))
    );
  }

  async getCompanyById(id: string): Promise<Company | null> {
    const { rows: company_rows } = await this.db.query(`${this.#select_companies_query} AND id = $1`, [id]);

    if (company_rows.length === 0) {
      return null;
    }

    const { rows: employee_rows } = await this.db.query(`SELECT * FROM users WHERE tenant_id = $1`, [id]);

    return Company.fromObject(this.mapCompany(company_rows[0], employee_rows));
  }

  private mapCompany(company: any, employee_rows: any[]) {
    const company_props: CompanyProps = {
      id: company.id,
      document: company.document,
      name: company.name,
      access_plan_id: company.access_plan_id,
      created_at: new Date(company.created_at),
      updated_at: new Date(company.updated_at),
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
        company_props.employees.push({
          id: employee.id,
          document: employee.document,
          email: employee.email,
          name: employee.name,
          created_at: new Date(employee.created_at),
          updated_at: new Date(employee.updated_at),
        });
      }
    }

    return company_props;
  }
}
