const rootConfig = require("./jest.config.js");

module.exports = {
  ...rootConfig,
  ...{
    displayName: "Integration Tests",
    clearMocks: true,
    setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
    testMatch: [
      "**/*.int.test.ts"
    ]
  }
}