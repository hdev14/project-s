import { TaxTypes } from "@company/domain/Commission";
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
};

export const update_company_brand_validation_schema: Schema = {
  color: {
    isHexColor: true,
    errorMessage: 'validation.color',
  },
};

export const create_service_log_validation_schema: Schema = {
  employee_id: {
    isUUID: true,
    errorMessage: 'validation.id',
  },
  customer_id: {
    isUUID: true,
    errorMessage: 'validation.id',
  },
  service_id: {
    isUUID: true,
    errorMessage: 'validation.id',
  },
};

export const create_commission_validation_schema: Schema = {
  catalog_item_id: {
    isUUID: true,
    errorMessage: 'validation.id',
  },
  tax: {
    isFloat: true,
    errorMessage: 'validation.number'
  },
  tax_type: {
    isIn: {
      options: [Object.values(TaxTypes)],
      errorMessage: 'validation.tax_type'
    }
  },
};

export const update_commission_validation_schema: Schema = {
  tax: {
    isFloat: true,
    errorMessage: 'validation.number'
  },
  tax_type: {
    isIn: {
      options: [Object.values(TaxTypes)],
      errorMessage: 'validation.tax_type'
    }
  },
};

export const create_employee_validation_schema: Schema = {
  name: {
    isString: true,
    errorMessage: 'validation.text',
  },
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
  policies: {
    isArray: true,
    errorMessage: 'validation.array'
  },
};

export const create_company_validation_schema: Schema = {
  name: {
    isString: true,
    errorMessage: 'validation.text',
  },
  email: {
    isEmail: true,
    errorMessage: 'validation.email'
  },
  document: {
    isNumeric: true,
    errorMessage: 'validation.number',
    isLength: {
      options: { min: 14 },
      errorMessage: 'validation.length',
    }
  },
  access_plan_id: {
    isUUID: true,
    errorMessage: 'validation.id',
  },
  'address.street': {
    isString: true,
    errorMessage: 'validation.text',
  },
  'address.district': {
    isString: true,
    errorMessage: 'validation.text',
  },
  'address.state': {
    isString: true,
    errorMessage: 'validation.text',
    isLength: {
      options: { max: 2 },
      errorMessage: 'validation.state'
    }
  },
  'address.number': {
    isString: true,
    errorMessage: 'validation.text',
  },
  'address.complement': {
    optional: true,
    isString: true,
    errorMessage: 'validation.text',
  },
  'bank.account': {
    isNumeric: true,
    errorMessage: 'validation.number',
    isLength: {
      options: { max: 10 },
      errorMessage: 'validation.length',
    }
  },
  'bank.account_digit': {
    isNumeric: true,
    errorMessage: 'validation.number',
    isLength: {
      options: { max: 2 },
      errorMessage: 'validation.length',
    }
  },
  'bank.agency': {
    isNumeric: true,
    errorMessage: 'validation.number',
    isLength: {
      options: { max: 6 },
      errorMessage: 'validation.length',
    }
  },
  'bank.agency_digit': {
    isNumeric: true,
    errorMessage: 'validation.number',
    isLength: {
      options: { max: 2 },
      errorMessage: 'validation.length',
    }
  },
  'bank.bank_code': {
    isNumeric: true,
    errorMessage: 'validation.number',
    isLength: {
      options: { max: 4 },
      errorMessage: 'validation.length',
    }
  },
};
