const rootConfig = require("./jest.config.js");

module.exports = {
  ...rootConfig,
  ...{
    displayName: "Integration Tests",
    coveragePathIgnorePatterns: [
      "/node_modules/",
      "/src/migrations"
    ],
    clearMocks: true,
    setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
    testMatch: [
      "**/*.int.test.ts"
    ]
  }
}