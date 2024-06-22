const rootConfig = require("./jest.config.js");

module.exports = {
  ...rootConfig,
  ...{
    displayName: "Unit Tests",
    coveragePathIgnorePatterns: [
      "/node_modules/",
      "/src/migrations"
    ],
    clearMocks: true,
    setupFilesAfterEnv: [],
    testMatch: [
      "**/*.unit.test.ts"
    ]
  }
}