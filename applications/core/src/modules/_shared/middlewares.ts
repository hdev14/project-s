import { NextFunction, Request, Response } from 'express';
import { Schema, checkSchema } from 'express-validator';
import HttpStatusCodes from './HttpStatusCodes';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(error: Error, _request: Request, response: Response, _next: NextFunction) {
  console.error(error);
  console.error(error.stack);
  return response.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
    message: 'Internal Server Error'
  });
}

export function requestValidator(schema: Schema) {
  return async (request: Request, response: Response, next: NextFunction) => {
    const results = await checkSchema(schema, ['body']).run(request);

    const errors: { message: string, field: string }[] = [];

    for (let idx = 0; idx < results.length; idx++) {
      const result = results[idx];
      if (!result.isEmpty()) {
        for (const error of result.array() as any[]) {
          errors.push({
            message: error.msg,
            field: error.path,
          });
        }
      }
    }

    if (errors.length > 0) {
      return response.status(HttpStatusCodes.BAD_REQUEST).json({
        errors,
      });
    }

    return next();
  }
}