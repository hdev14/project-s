const rootConfig = require("./jest.config.js");

module.exports = {
  ...rootConfig,
  ...{
    displayName: "E2E Tests",
    coveragePathIgnorePatterns: [
      "/node_modules/",
    ],
    clearMocks: true,
    setupFilesAfterEnv: [],
    testMatch: [
      "**/*.e2e.test.ts"
    ]
  }
}