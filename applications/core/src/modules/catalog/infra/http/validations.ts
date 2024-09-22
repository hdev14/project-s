import { Schema } from "express-validator";

export const create_catalog_item_validation_schema: Schema = {
  name: {
    isString: true,
    errorMessage: 'validation.text',
  },
  description: {
    isLength: { options: { min: 8 } },
    errorMessage: 'validation.password',
  },
  amount: {
    isFloat: true,
    errorMessage: 'validation.number',
  },
  attributes: {
    isArray: true,
    errorMessage: 'validation.array',
  },
  'attributes.*.name': {
    isString: true,
    errorMessage: 'validation.text',
  },
  'attributes.*.description': {
    isString: true,
    errorMessage: 'validation.text',
  },
  is_service: {
    isBoolean: true,
    optional: true,
    errorMessage: 'validation.boolean'
  },
  tenant_id: {
    isUUID: true,
    errorMessage: 'validation.id'
  },
};


export const update_catalog_item_validation_schema: Schema = {
  name: {
    isString: true,
    optional: true,
    errorMessage: 'validation.email',
  },
  description: {
    isLength: { options: { min: 8 } },
    optional: true,
    errorMessage: 'validation.password',
  },
  attributes: {
    isArray: true,
    optional: true,
    errorMessage: 'validation.array',
  },
  'attributes.*.name': {
    isString: true,
    errorMessage: 'validation.text',
  },
  'attributes.*.description': {
    isString: true,
    errorMessage: 'validation.text',
  }
};
