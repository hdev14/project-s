import Database from "@shared/Database";
import DbUtils from "@shared/utils/DbUtils";
import Pagination, { PaginatedResult } from "@shared/utils/Pagination";
import { injectable } from "inversify";
import { Pool } from "pg";
import 'reflect-metadata';
import ServiceLogRepository, { ServiceLogsFilter } from "../../app/ServiceLogRepository";
import ServiceLog, { ServiceLogProps } from "../../domain/ServiceLog";

@injectable()
export default class DbServiceLogRepository implements ServiceLogRepository {
  #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  async getServiceLogs(filter: ServiceLogsFilter): Promise<PaginatedResult<ServiceLogProps>> {
    const { rows, page_result } = await this.selectServiceLogs(filter);

    const results = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      results.push({
        id: row.id,
        customer_id: row.customer_id,
        paid_amount: row.paid_amount,
        registed_at: row.registed_at,
        tenant_id: row.tenant_id,
        commission_amount: row.commission_amount,
        employee_id: row.employee_id,
        service_id: row.service_id,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      });
    }

    return { results, page_result };
  }

  private async selectServiceLogs(filter: ServiceLogsFilter) {
    const query = 'SELECT * FROM service_logs WHERE tenant_id = $1';

    if (filter.page_options) {
      const count_query = 'SELECT count(id) as total FROM service_logs WHERE tenant_id = $1';
      const offset = Pagination.calculateOffset(filter.page_options);
      const count_result = await this.#db.query(count_query, [filter.tenant_id]);

      const paginated_query = `${query} LIMIT $2 OFFSET $3`;

      const result = await this.#db.query(paginated_query, [filter.tenant_id, filter.page_options.limit, offset]);

      const page_result = (count_result.rows[0].total !== undefined && count_result.rows[0].total > 0)
        ? Pagination.calculatePageResult(count_result.rows[0].total, filter!.page_options!)
        : undefined;

      return { rows: result.rows, page_result };
    }

    const { rows } = await this.#db.query(query, [filter.tenant_id]);

    return { rows };
  }

  async createServiceLog(service_log: ServiceLog): Promise<void> {
    const service_log_obj = service_log.toObject();
    const values = Object.values(service_log_obj)

    await this.#db.query(
      `INSERT INTO service_logs ${DbUtils.columns(service_log_obj)} VALUES ${DbUtils.values(values)}`,
      values
    );
  }
}
