import ServiceLogRepository from "../app/ServiceLogRepository";
import ServiceLog from "../domain/ServiceLog";

export default class DbServiceLogRepository implements ServiceLogRepository {
  getServiceLogsByCompanyId(company_id: string): Promise<ServiceLog[]> {
    throw new Error("Method not implemented.");
  }
  createServiceLog(service_log: ServiceLog): Promise<void> {
    throw new Error("Method not implemented.");
  }
}