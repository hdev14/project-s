import { PaymentTypes } from "@subscriber/domain/PaymentMethod";
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

export const update_subscriber_payment_method_validation_schema: Schema = {
  payment_type: {
    isIn: {
      options: [Object.values(PaymentTypes)],
      errorMessage: 'validation.payment_type'
    }
  },
  credit_card_token: {
    optional: true,
    isString: true,
    errorMessage: 'validation.text',
  },
};
