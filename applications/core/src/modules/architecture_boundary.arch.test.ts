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
});