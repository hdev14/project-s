import "tsarch/dist/jest";

import path from "path";
import { filesOfProject } from "tsarch";

describe("Architecture Boundaries", () => {
  jest.setTimeout(60000);

  const modules = [
    'auth',
    'company',
    'subscriber',
    'subscription',
    'payment',
    'catalog'
  ];

  test.each(modules)("Module(%s): domain logic should not depends on application logic", async (module) => {
    const rule = filesOfProject(path.resolve(__dirname, '..', 'tsconfig.json'))
      .inFolder(`${module}/domain`)
      .shouldNot()
      .dependOnFiles()
      .inFolder(`${module}/app`);

    await expect(rule).toPassAsync()
  });

  test.each(modules)("Module(%s): domain logic should not depends on infra logic", async (module) => {
    const rule = filesOfProject(path.resolve(__dirname, '..', 'tsconfig.json'))
      .inFolder(`${module}/domain`)
      .shouldNot()
      .dependOnFiles()
      .inFolder(`${module}/infra`);

    await expect(rule).toPassAsync()
  });

  test.each(modules)("Module(%s): application logic should not depends on infra logic", async (module) => {
    const rule = filesOfProject(path.resolve(__dirname, '..', 'tsconfig.json'))
      .inFolder(`${module}/app`)
      .shouldNot()
      .dependOnFiles()
      .inFolder(`${module}/infra`);

    await expect(rule).toPassAsync()
  });

  it('should not have cyclic dependency between modules', async () => {
    const auth_rule = filesOfProject(path.resolve(__dirname, '..', 'tsconfig.json'))
      .inFolder('auth')
      .should()
      .beFreeOfCycles();

    const catalog_rule = filesOfProject(path.resolve(__dirname, '..', 'tsconfig.json'))
      .inFolder('catalog')
      .should()
      .beFreeOfCycles();

    const company_rule = filesOfProject(path.resolve(__dirname, '..', 'tsconfig.json'))
      .inFolder('company')
      .should()
      .beFreeOfCycles();

    const payment_rule = filesOfProject(path.resolve(__dirname, '..', 'tsconfig.json'))
      .inFolder('payment')
      .should()
      .beFreeOfCycles();

    const subscriber_rule = filesOfProject(path.resolve(__dirname, '..', 'tsconfig.json'))
      .inFolder('subscriber')
      .should()
      .beFreeOfCycles();

    const subscription_rule = filesOfProject(path.resolve(__dirname, '..', 'tsconfig.json'))
      .inFolder('subscription')
      .should()
      .beFreeOfCycles();

    await expect(auth_rule).toPassAsync();
    await expect(catalog_rule).toPassAsync();
    await expect(company_rule).toPassAsync();
    await expect(payment_rule).toPassAsync();
    await expect(subscriber_rule).toPassAsync();
    await expect(subscription_rule).toPassAsync();
  });
});
