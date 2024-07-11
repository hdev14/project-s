import { PageOptions, PaginatedResult } from "@shared/utils/Pagination";
import ServiceLog from "../domain/ServiceLog";


export type ServiceLogsFilter = {
  tenant_id: string;
  page_options?: PageOptions;
};

export default interface ServiceLogRepository {
  getServiceLogs(filter: ServiceLogsFilter): Promise<PaginatedResult<ServiceLog>>;
  createServiceLog(service_log: ServiceLog): Promise<void>;
}