import ServiceLog from "../domain/ServiceLog";

export default interface ServiceLogRepository {
  getServiceLogsByCompanyId(company_id: string): Promise<Array<ServiceLog>>;
  createServiceLog(service_log: ServiceLog): Promise<void>;
}