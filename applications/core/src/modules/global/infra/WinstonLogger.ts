import { injectable } from 'inversify';
import 'reflect-metadata';
import winston from 'winston';
import Logger from '../app/Logger';

@injectable()
export default class WinstonLogger implements Logger {
  #logger: winston.Logger;

  constructor() {
    this.#logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.colorize({ message: true }),
        winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(WinstonLogger.template)
      ),
      transports: [new winston.transports.Console()]
    });
  }

  error(error: string | Error, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV !== 'test') {
      if (typeof error === 'string') {
        this.#logger.log('error', error, { metadata });
        return;
      }

      this.#logger.error(error);
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV !== 'test') {
      this.#logger.info(message, { metadata });
    }
  }

  private static template(info: winston.Logform.TransformableInfo) {
    if (info.level === 'error' && !(typeof info.metadata === 'object')) {
      return `[${info.timestamp}] ${info.level}: ${info.message} \n ${info.stack}`;
    }

    if (typeof info.metadata === 'object') {
      return `[${info.timestamp}] ${info.level}: ${info.message} \n ${JSON.stringify(info.metadata, null, 2)}`;
    }

    return `[${info.timestamp}] ${info.level}: ${info.message}`;
  }
}
