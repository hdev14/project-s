import AuthProvider from '@shared/infra/AuthProvider';
import Module from '@shared/infra/Module';
import { errorHandler } from '@shared/infra/middlewares';
import cookieParser from 'cookie-parser';
import express from 'express';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';

export type ApplicationOptions = {
  modules: Array<Module>;
};

export default class Application {
  #server: express.Application;
  #container: Container;

  constructor({ modules }: ApplicationOptions) {
    this.#container = this.setupModules(modules);
    const server = new InversifyExpressServer(
      this.#container,
      null,
      null,
      null,
      AuthProvider
    );

    server.setConfig((app) => {
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(cookieParser());
    });

    server.setErrorConfig((app) => {
      app.use(errorHandler);
    });

    this.#server = server.build();
  }

  get server() {
    return this.#server;
  }

  get container() {
    return this.#container;
  }

  private setupModules(modules: Array<Module>) {
    const container = new Container();
    for (let idx = 0; idx < modules.length; idx++) {
      container.load(modules[idx].init());
    }
    return container;
  }
}