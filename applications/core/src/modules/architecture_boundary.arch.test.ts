import "tsarch/dist/jest";

import { filesOfProject } from "tsarch";

describe("Architecture Boundaries", () => {
  jest.setTimeout(60000);

  it("domain logic should not depends on application logic", async () => {
    const rule = filesOfProject()
      .inFolder("domain")
      .shouldNot()
      .dependOnFiles()
      .inFolder("app");

    await expect(rule).toPassAsync()
  });

  it("domain logic should not depends on infra logic", async () => {
    const rule = filesOfProject()
      .inFolder("domain")
      .shouldNot()
      .dependOnFiles()
      .inFolder("infra");

    await expect(rule).toPassAsync()
  });

  it("application logic should not depends on infra logic", async () => {
    const rule = filesOfProject()
      .inFolder("app")
      .shouldNot()
      .dependOnFiles()
      .inFolder("infra");

    await expect(rule).toPassAsync()
  });

  it('should not have cyclic dependency between modules', () => {
    const auth_rule = filesOfProject()
      .inFolder('auth')
      .should()
      .beFreeOfCycles();

    const catalog_rule = filesOfProject()
      .inFolder('catalog')
      .should()
      .beFreeOfCycles();

    const company_rule = filesOfProject()
      .inFolder('company')
      .should()
      .beFreeOfCycles();

    const payment_rule = filesOfProject()
      .inFolder('payment')
      .should()
      .beFreeOfCycles();

    const subscriber_rule = filesOfProject()
      .inFolder('subscriber')
      .should()
      .beFreeOfCycles();

    const subscription_rule = filesOfProject()
      .inFolder('subscription')
      .should()
      .beFreeOfCycles();

    expect(auth_rule).toPassAsync();
    expect(catalog_rule).toPassAsync();
    expect(company_rule).toPassAsync();
    expect(payment_rule).toPassAsync();
    expect(subscriber_rule).toPassAsync();
    expect(subscription_rule).toPassAsync();
  });
});