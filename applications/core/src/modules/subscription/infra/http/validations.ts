import { Schema } from "express-validator";

export const create_subscription_validation_schema: Schema = {
  subscriber_id: {
    isUUID: true,
    errorMessage: 'validation.id'
  },
  subscription_plan_id: {
    isUUID: true,
    errorMessage: 'validation.id'
  },
  tenant_id: {
    isUUID: true,
    errorMessage: 'validation.id'
  },
};
