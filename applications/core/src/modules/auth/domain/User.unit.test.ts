import { faker } from '@faker-js/faker/locale/pt_BR';
import AccessPlan, { AccessPlanTypes } from './AccessPlan';
import Policy from './Policy';
import User from "./User";

describe('User unit tests', () => {
  it('should attach a policy', () => {
    const user = new User({
      email: faker.internet.email(),
      password: faker.string.alphanumeric(),
      policies: [],
    });

    const slug = faker.word.verb();

    const policy = new Policy({
      id: faker.string.uuid(),
      description: faker.lorem.lines(),
      slug,
    });

    user.attachPolicy(policy);

    expect(user.toObject().policies).toContain(slug);
  });

  it('should not attach the same a policy twice', () => {
    const slug = faker.word.verb();

    const user = new User({
      email: faker.internet.email(),
      password: faker.string.alphanumeric(),
      policies: [slug],
    });


    const policy = new Policy({
      id: faker.string.uuid(),
      description: faker.lorem.lines(),
      slug,
    });

    user.attachPolicy(policy);

    expect(user.toObject().policies).toHaveLength(1);
  });

  it('should dettach a policy', () => {
    const slug = faker.word.verb();

    const user = new User({
      email: faker.internet.email(),
      password: faker.string.alphanumeric(),
      policies: [slug],
    });

    const policy = new Policy({
      id: faker.string.uuid(),
      description: faker.lorem.lines(),
      slug,
    });

    user.dettachPolicy(policy);

    expect(user.toObject().policies).not.toContain(slug);
  });

  it('should change the access plan', () => {
    const user = new User({
      email: faker.internet.email(),
      password: faker.string.alphanumeric(),
      policies: [],
    });

    const access_plan = new AccessPlan({
      id: faker.string.uuid(),
      active: true,
      amount: faker.number.float(),
      type: AccessPlanTypes.MONTHLY,
      description: faker.lorem.lines(),
    });

    user.changeAccessPlan(access_plan);

    expect(user.toObject().access_plan_id).toEqual(access_plan.id);
  });

  it('should update password', () => {
    const user = new User({
      email: faker.internet.email(),
      password: faker.string.alphanumeric(),
      policies: [],
    });

    const new_password = faker.string.alphanumeric();

    user.password = new_password

    expect(user.toObject().password).toEqual(new_password);
  });

  it('should update email', () => {
    const user = new User({
      email: faker.internet.email(),
      password: faker.string.alphanumeric(),
      policies: [],
    });

    const new_email = faker.internet.email();

    user.email = new_email;

    expect(user.toObject().email).toEqual(new_email);
  });
});