import { UserObject } from "@auth/domain/User";
import { interfaces } from "inversify-express-utils";

export enum Policies {
  /* auth */
  CREATE_TENANT_USER = 'create_tenant_user',
  LIST_USERS = 'list_users',
  UPDATE_USER = 'update_user',
  UPDATE_USER_POLICIES = 'update_user_policies',
  CHANGE_ACCESS_PLAN = 'change_access_plan',
  CREATE_ACCESS_PLAN = 'create_access_plan',
  UPDATE_ACCESS_PLAN = 'update_access_plan',
  LIST_POLICIES = 'list_policies',
  /* catalog */
  UPDATE_CATALOG_ITEM = 'update_catalog_item',
  CREATE_CATALOG_ITEM = 'create_catalog_item',
  LIST_CATALOG_ITEMS = 'list_catalog_items',
}

export class Principal implements interfaces.Principal {
  details: UserObject | null;

  constructor(user: UserObject | null) {
    this.details = user;
  }

  isAuthenticated(): Promise<boolean> {
    return Promise.resolve(this.details !== null);
  }

  isResourceOwner(resourceId: any): Promise<boolean> {
    if (this.details !== null) {
      return Promise.resolve(this.details.id === resourceId || this.details.tenant_id === resourceId);
    }

    return Promise.resolve(false);
  }

  isInRole(role: string): Promise<boolean> {
    if (this.details !== null) {
      let has_role = false;

      for (let idx = 0; idx < this.details.policies.length; idx++) {
        if (this.details.policies[idx] === role) {
          has_role = true;
          break;
        }
      }

      return Promise.resolve(has_role);
    }

    return Promise.resolve(false);
  }
}
