import { AccessPlanTypes } from "@auth/domain/AccessPlan";
import UserTypes from "@shared/UserTypes";
import { Schema } from "express-validator";

export const create_user_validation_schema: Schema = {
  email: {
    isEmail: true,
    errorMessage: 'validation.email',
  },
  password: {
    isLength: { options: { min: 8 } },
    errorMessage: 'validation.password',
  },
  access_plan_id: {
    isUUID: true,
    optional: true,
    errorMessage: 'validation.id'
  },
  tenant_id: {
    isUUID: true,
    optional: true,
    errorMessage: 'validation.id'
  },
  type: {
    isIn: {
      options: [Object.values(UserTypes)],
      errorMessage: 'validation.user_types'
    }
  },
};

export const update_user_validation_schema: Schema = {
  email: {
    isEmail: true,
    errorMessage: 'validation.email',
    optional: true,
  },
  password: {
    isLength: { options: { min: 8 } },
    errorMessage: 'validation.password',
    optional: true,
  },
};

export const update_policies_validation_schema: Schema = {
  policy_slugs: {
    isArray: {
      errorMessage: 'validation.array',
      options: {
        min: 1,
      }
    },
  },
  mode: {
    isString: true,
    custom: {
      if: (value: string) => !['attach', 'dettach'].includes(value),
      errorMessage: 'validation.custom'
    }
  }
};

export const login_validation_schema: Schema = {
  email: {
    isEmail: true,
    errorMessage: 'validation.email',
  },
  password: {
    isLength: { options: { min: 8 } },
    errorMessage: 'validation.password',
  },
};

export const create_access_plan_validation_schema: Schema = {
  amount: {
    isFloat: true,
    errorMessage: 'validation.number',
  },
  type: {
    isIn: {
      options: [Object.values(AccessPlanTypes)],
      errorMessage: 'validation.access_plan_type'
    }
  },
  description: {
    isString: true,
    optional: true,
    errorMessage: 'validation.text'
  },
}


export const update_access_plan_validation_schema: Schema = {
  amount: {
    optional: true,
    isFloat: true,
    errorMessage: 'validation.number',
  },
  type: {
    optional: true,
    isIn: {
      options: [Object.values(AccessPlanTypes)],
      errorMessage: 'validation.access_plan_type'
    }
  },
  description: {
    isString: true,
    optional: true,
    errorMessage: 'validation.text'
  },
  active: {
    isBoolean: true,
    optional: true,
    errorMessage: 'validation.boolean'
  },
};

export const forgot_password_validation_schema: Schema = {
  email: {
    isEmail: true,
    errorMessage: 'validation.email',
  }
};

export const reset_password_validation_schema: Schema = {
  code: {
    isLength: { options: { max: 4 } },
    errorMessage: 'validation.code',
  },
  password: {
    isLength: { options: { min: 8 } },
    errorMessage: 'validation.password',
  },
};
