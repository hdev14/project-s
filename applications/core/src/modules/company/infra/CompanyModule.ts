import CommissionRepository from "@company/app/CommissionRepository";
import CompanyRepository from "@company/app/CompanyRepository";
import CompanyService from "@company/app/CompanyService";
import Module from "@shared/infra/Module";
import types from "@shared/infra/types";
import { ContainerModule } from "inversify";
import DbCommissionRepository from "./persistence/DbCommissionRepository";
import DbCompanyRepository from "./persistence/DbCompanyRepository";
import ServiceLogRepository from "@company/app/ServiceLogRepository";
import DbServiceLogRepository from "./persistence/DbServiceLogRepository";

export default class CompanyModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind) => {
      bind<CompanyService>(types.CompanyService).to(CompanyService).inSingletonScope();
      bind<CompanyRepository>(types.CompanyRepository).to(DbCompanyRepository).inSingletonScope();
      bind<CommissionRepository>(types.CommissionRepository).to(DbCommissionRepository).inSingletonScope();
      bind<ServiceLogRepository>(types.ServiceLogRepository).to(DbServiceLogRepository).inSingletonScope();
    });

    return module;
  }
}