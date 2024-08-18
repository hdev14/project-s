const rootConfig = require("./jest.config.js");

module.exports = {
  ...rootConfig,
  ...{
    displayName: "E2E Tests",
    clearMocks: true,
    setupFilesAfterEnv: ["<rootDir>/src/test_setup.ts"],
    testMatch: [
      "**/*.e2e.test.ts"
    ]
  }
}
