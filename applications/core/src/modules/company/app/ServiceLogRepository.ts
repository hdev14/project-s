import Page from "@shared/utils/Page";
import { PageOptions } from "@shared/utils/Pagination";
import ServiceLog, { ServiceLogProps } from "../domain/ServiceLog";


export type ServiceLogsFilter = {
  tenant_id: string;
  page_options?: PageOptions;
};

export default interface ServiceLogRepository {
  getServiceLogs(filter: ServiceLogsFilter): Promise<Page<ServiceLogProps>>;
  createServiceLog(service_log: ServiceLog): Promise<void>;
}
