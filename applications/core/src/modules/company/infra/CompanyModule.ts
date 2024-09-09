import CommissionRepository from "@company/app/CommissionRepository";
import CompanyRepository from "@company/app/CompanyRepository";
import CompanyService from "@company/app/CompanyService";
import ServiceLogRepository from "@company/app/ServiceLogRepository";
import Module from "@shared/Module";
import types from "@shared/types";
import { ContainerModule } from "inversify";
import './http/CompanyController';
import DbCommissionRepository from "./persistence/DbCommissionRepository";
import DbCompanyRepository from "./persistence/DbCompanyRepository";
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
