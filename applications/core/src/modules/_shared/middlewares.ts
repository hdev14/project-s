import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { Schema, checkSchema } from 'express-validator';
import multer from 'multer';
import { resolve } from 'path';
import Logger from '../global/app/Logger';
import HttpStatusCodes from './HttpStatusCodes';

export function createErrorHandlerWithLogger(logger: Logger) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (error: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(error);
    console.log(error);
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error'
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(error);
  return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
    message: 'Internal Server Error'
  });
}

export function requestValidator(schema: Schema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const results = await checkSchema(schema, ['body']).run(req);

    const errors: { message: string, field: string }[] = [];

    for (let idx = 0; idx < results.length; idx++) {
      const result = results[idx];
      if (!result.isEmpty()) {
        for (const error of result.array() as any[]) {
          errors.push({
            message: res.__(error.msg),
            field: error.path,
          });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        errors,
      });
    }

    return next();
  }
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, resolve(__dirname, './tmp/uploads'));
  },
  filename: function (_req, file, cb) {
    const ext = file.originalname.split('.')[1];
    cb(null, `${file.fieldname}-${randomUUID()}.${ext}`);
  }
});

export const upload = multer({ storage });
