import { RecurrenceTypes } from "@subscription/domain/SubscriptionPlan";
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
  }
};

export const create_subscription_plan_validation_schema: Schema = {
  item_ids: {
    isArray: true,
    errorMessage: 'validation.array'
  },
  'item_ids.*': {
    isUUID: true,
    errorMessage: 'validation.id',
  },
  recurrence_type: {
    isIn: {
      options: [Object.values(RecurrenceTypes)],
      errorMessage: 'validation.recurrence_types'
    }
  },
  tenant_id: {
    isUUID: true,
    errorMessage: 'validation.id'
  },
};
