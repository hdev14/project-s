import { diag, DiagConsoleLogger } from '@opentelemetry/api';
import { injectable } from 'inversify';
import 'reflect-metadata';
import Logger from '../app/Logger';

@injectable()
export default class OpenTelemetryLogger implements Logger {
  constructor() {
    diag.setLogger(new DiagConsoleLogger());
  }

  error(error: string | Error, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV !== 'test') {
      if (typeof error === 'string') {
        diag.error('error', error, { metadata });
        return;
      }

      diag.error(error.stack ?? error.message);
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV !== 'test') {
      diag.info(message, { metadata });
    }
  }
}
