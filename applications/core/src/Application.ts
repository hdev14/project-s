import Logger from '@global/app/Logger';
import AuthProvider from '@shared/AuthProvider';
import Module from '@shared/Module';
import { createErrorHandlerWithLogger, errorHandler } from '@shared/middlewares';
import types from '@shared/types';
import cookieParser from 'cookie-parser';
import express from 'express';
import { I18n } from 'i18n';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';
import path from 'path';

export type ApplicationOptions = {
  modules: Array<Module>;
};

export default class Application {
  readonly #server: express.Application;
  readonly #container: Container;

  constructor({ modules }: ApplicationOptions) {
    this.#container = this.setupModules(modules);

    const server = new InversifyExpressServer(
      this.#container,
      null,
      null,
      null,
      AuthProvider
    );

    const i18n = new I18n({
      locales: ['pt', 'en'],
      defaultLocale: 'pt',
      cookie: 'api-language',
      directory: path.join(__dirname, './modules/_shared/i18n'),
      updateFiles: false,
    });

    server.setConfig((app) => {
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(cookieParser());
      app.use(i18n.init);
      // TODO: https://redis.io/docs/latest/develop/connect/clients/nodejs/
      // TODO: https://expressjs.com/en/advanced/best-practice-security.html
      // TODO: https://opentelemetry.io/docs/languages/js/getting-started/nodejs/
      // TODO: https://expressjs.com/en/advanced/best-practice-performance.html
      // TODO: https://www.npmjs.com/package/pm2
    });

    server.setErrorConfig((app) => {
      if (process.env.NODE_ENV !== 'test') {
        app.use(createErrorHandlerWithLogger(this.#container.get<Logger>(types.Logger)));
      } else {
        app.use(errorHandler);
      }
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
