import Database from "@shared/infra/Database";
import Collection from "@shared/utils/Collection";
import Pagination, { PaginatedResult } from "@shared/utils/Pagination";
import { Pool } from "pg";
import ServiceLogRepository, { ServiceLogsFilter } from "../app/ServiceLogRepository";
import ServiceLog from "../domain/ServiceLog";

export default class DbServiceLogRepository implements ServiceLogRepository {
  #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  async getServiceLogs(filter: ServiceLogsFilter): Promise<PaginatedResult<ServiceLog>> {
    const { rows, page_result } = await this.selectServiceLogs(filter);

    const service_logs = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      service_logs.push(new ServiceLog({
        id: row.id,
        customer_id: row.customer_id,
        paid_amount: row.paid_amount,
        registed_at: row.registed_at,
        tenant_id: row.tenant_id,
        commission_amount: row.commission_amount,
        employee_id: row.employee_id,
        service_id: row.service_id,
      }))
    }

    return { results: new Collection(service_logs), page_result };
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

  createServiceLog(service_log: ServiceLog): Promise<void> {
    throw new Error("Method not implemented.");
  }
}