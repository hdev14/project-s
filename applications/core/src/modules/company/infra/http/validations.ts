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

export const update_company_bank_validation_schema: Schema = {
  account: {
    isNumeric: true,
    errorMessage: 'validation.number',
    isLength: {
      options: { max: 10 },
      errorMessage: 'validation.length',
    }
  },
  account_digit: {
    isNumeric: true,
    errorMessage: 'validation.number',
    isLength: {
      options: { max: 2 },
      errorMessage: 'validation.length',
    }
  },
  agency: {
    isNumeric: true,
    errorMessage: 'validation.number',
    isLength: {
      options: { max: 6 },
      errorMessage: 'validation.length',
    }
  },
  agency_digit: {
    isNumeric: true,
    errorMessage: 'validation.number',
    isLength: {
      options: { max: 2 },
      errorMessage: 'validation.length',
    }
  },
  bank_code: {
    isNumeric: true,
    errorMessage: 'validation.number',
    isLength: {
      options: { max: 4 },
      errorMessage: 'validation.length',
    }
  },
}

export const update_company_brand_validation_schema: Schema = {
  color: {
    isHexColor: true,
    errorMessage: 'validation.color',
  },
  logo_url: {
    isURL: true,
    errorMessage: 'validation.url'
  },
}