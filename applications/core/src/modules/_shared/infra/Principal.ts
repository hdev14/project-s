import { UserObject } from "@auth/domain/User";
import { interfaces } from "inversify-express-utils";


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
