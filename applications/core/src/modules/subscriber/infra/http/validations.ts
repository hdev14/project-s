import { Schema } from "express-validator";

export const update_subscriber_address_validation_schema: Schema = {
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

export const update_subscriber_perfonal_info_validation_schema: Schema = {
  email: {
    isEmail: true,
    errorMessage: 'validation.email'
  },
  document: {
    isString: true,
    errorMessage: 'validation.text',
    isLength: {
      options: { min: 11 },
      errorMessage: 'validation.length',
    }
  },
  phone_number: {
    isString: true,
    errorMessage: 'validation.text',
    isLength: {
      options: { min: 11 },
      errorMessage: 'validation.length',
    }
  },
};
