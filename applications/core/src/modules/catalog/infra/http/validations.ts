import { Schema } from "express-validator";

export const create_catalog_item_validation_schema: Schema = {
  name: {
    isString: true,
    errorMessage: 'O campo precisa ser um endereço de e-mail válido',
  },
  description: {
    isLength: { options: { min: 8 } },
    errorMessage: 'O campo precisa ter no minimo 8 caracteres',
  },
  attributes: {
    isArray: true,
    errorMessage: 'O campo precisa ser uma lista',
  },
  'attributes.*.name': {
    isString: true,
    errorMessage: 'O campo precisa ser texto valido',
  },
  'attributes.*.description': {
    isString: true,
    errorMessage: 'O campo precisa ser texto valido',
  },
  is_service: {
    isBoolean: true,
    optional: true,
    errorMessage: 'O campo precisa ser um boleano'
  },
  picture_url: {
    isURL: true,
    errorMessage: 'O campo precisa ser uma url válida'
  },
  tenant_id: {
    isUUID: true,
    errorMessage: 'O campo precisa ser um ID valido'
  },
};


export const update_catalog_item_validation_schema: Schema = {
  name: {
    isString: true,
    optional: true,
    errorMessage: 'O campo precisa ser um endereço de e-mail válido',
  },
  description: {
    isLength: { options: { min: 8 } },
    optional: true,
    errorMessage: 'O campo precisa ter no minimo 8 caracteres',
  },
  attributes: {
    isArray: true,
    optional: true,
    errorMessage: 'O campo precisa ser uma lista',
  },
  'attributes.*.name': {
    isString: true,
    errorMessage: 'O campo precisa ser texto valido',
  },
  'attributes.*.description': {
    isString: true,
    errorMessage: 'O campo precisa ser texto valido',
  },
  picture_url: {
    isURL: true,
    optional: true,
    errorMessage: 'O campo precisa ser uma url válida'
  },
};