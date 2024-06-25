import { Schema } from "express-validator";

export const create_user_validation_schema: Schema = {
  email: {
    isEmail: true,
    errorMessage: 'O campo precisa ser um endereço de e-mail válido',
  },
  password: {
    isLength: { options: { min: 8 } },
    errorMessage: 'O campo precisa ter no minimo 8 caracteres',
  },
  access_plan_id: {
    isUUID: true,
    optional: true,
    errorMessage: 'O campo precisa ser um ID valido'
  },
};

export const update_user_validation_schema: Schema = {
  email: {
    isEmail: true,
    errorMessage: 'O campo precisa ser um endereço de e-mail válido',
    optional: true,
  },
  password: {
    isLength: { options: { min: 8 } },
    errorMessage: 'O campo precisa ter no minimo 8 caracteres',
    optional: true,
  },
};