import { ContainerModule } from "inversify";

export default interface Module {
  init(): ContainerModule;
}