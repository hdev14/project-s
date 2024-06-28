import Policy from "@auth/domain/Policy";
import { faker } from '@faker-js/faker/locale/pt_BR';

describe('Policy unit tests', () => {
  it('should slugify the policy', () => {
    const first = faker.word.verb();
    const second = faker.word.verb();

    let policy = new Policy({
      slug: `${first} ${second}`,
    });

    expect(policy.toObject().slug).toEqual(`${first}_${second}`.toLocaleLowerCase());

    const third = faker.word.verb();

    policy = new Policy({
      slug: `${first} ${second} ${third}`,
    });

    expect(policy.toObject().slug).toEqual(`${first}_${second}_${third}`.toLocaleLowerCase());
  });
});