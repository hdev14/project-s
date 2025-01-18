import DefaultRepository from "@shared/DefaultRepository";
import DbUtils from "@shared/utils/DbUtils";
import Page from "@shared/utils/Page";
import { injectable } from "inversify";
import 'reflect-metadata';
import ServiceLogRepository, { ServiceLogsFilter } from "../../app/ServiceLogRepository";
import ServiceLog, { ServiceLogProps } from "../../domain/ServiceLog";

@injectable()
export default class DbServiceLogRepository extends DefaultRepository implements ServiceLogRepository {
  async getServiceLogs(filter: ServiceLogsFilter): Promise<Page<ServiceLogProps>> {
    const { rows, page_info } = await this.selectServiceLogs(filter);

    const result = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      result.push(ServiceLog.fromObject({
        id: row.id,
        customer_id: row.customer_id,
        paid_amount: parseFloat(row.paid_amount),
        registed_at: row.registed_at,
        tenant_id: row.tenant_id,
        commission_amount: parseFloat(row.commission_amount),
        employee_id: row.employee_id,
        service_id: row.service_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    }

    return new Page(result, page_info);
  }

  private async selectServiceLogs(filter: ServiceLogsFilter) {
    const query = 'SELECT * FROM service_logs WHERE tenant_id = $1';
    const values: unknown[] = [filter.tenant_id];

    if (filter.page_options) {
      return this.getRowsPaginated({
        main_query: query,
        count_query: 'SELECT count(id) as total FROM service_logs WHERE tenant_id = $1',
        page_options: filter.page_options,
        values
      });
    }

    const { rows } = await this.db.query(query, values);

    return { rows, page_info: undefined };
  }

  async createServiceLog(service_log: ServiceLog): Promise<void> {
    const service_log_obj = service_log.toObject();
    const values = Object.values(service_log_obj)

    await this.db.query(
      `INSERT INTO service_logs ${DbUtils.columns(service_log_obj)} VALUES ${DbUtils.values(values)}`,
      values
    );
  }
}
