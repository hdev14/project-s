import AccessPlan, { AccessPlanTypes } from "@auth/domain/AccessPlan";
import { faker } from '@faker-js/faker/locale/pt_BR';

describe('AccessPlan unit tests', () => {
  it('should deactivate the access plan', () => {
    const access_plan = new AccessPlan({
      id: faker.string.uuid(),
      active: true,
      amount: faker.number.float(),
      type: AccessPlanTypes.MONTHLY,
      description: faker.lorem.lines(),
    });

    access_plan.deactivate();

    expect(access_plan.toObject().active).toBe(false);
  });

  it('should activate the access plan', () => {
    const access_plan = new AccessPlan({
      id: faker.string.uuid(),
      active: false,
      amount: faker.number.float(),
      type: AccessPlanTypes.MONTHLY,
      description: faker.lorem.lines(),
    });

    access_plan.activate();

    expect(access_plan.toObject().active).toBe(true);
  });
});