import AuthModule from '@auth/infra/AuthModule';
import express from 'express';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';

export default class Server {
  #application: express.Application;
  #container: Container;

  constructor() {
    this.#container = this.setupModules();
    const server = new InversifyExpressServer(this.#container);
    server.setConfig((app) => {
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
    });

    this.#application = server.build();
  }

  get application() {
    return this.#application;
  }

  get container() {
    return this.#container;
  }

  private setupModules() {
    const auth_module = AuthModule.init();
    const container = new Container();
    container.load(auth_module);
    return container;
  }
}