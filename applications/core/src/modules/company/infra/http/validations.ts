import { Schema } from "express-validator";

export const update_company_address_validation_schema: Schema = {
  street: {
    isString: true,
    errorMessage: 'validation.text',
  },
  district: {
    isString: true,
    errorMessage: 'validation.text',
  },
  state: {
    isString: true,
    errorMessage: 'validation.text',
    isLength: {
      options: { max: 2 },
      errorMessage: 'validation.state'
    }
  },
  number: {
    isString: true,
    errorMessage: 'validation.text',
  },
  complement: {
    isString: true,
    errorMessage: 'validation.text',
  },
};