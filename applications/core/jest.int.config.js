const rootConfig = require("./jest.config.js");

module.exports = {
  ...rootConfig,
  ...{
    displayName: "Integration Tests",
    clearMocks: true,
    setupFilesAfterEnv: ["<rootDir>/src/test_setup.ts"],
    testMatch: [
      "**/*.int.test.ts"
    ]
  }
}