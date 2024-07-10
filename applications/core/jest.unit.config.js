const rootConfig = require("./jest.config.js");

module.exports = {
  ...rootConfig,
  ...{
    displayName: "Unit Tests",
    clearMocks: true,
    setupFilesAfterEnv: [],
    testMatch: [
      "**/*.unit.test.ts"
    ]
  }
}