const rootConfig = require("./jest.config.js");

module.exports = {
  ...rootConfig,
  ...{
    displayName: "E2E Tests",
    coveragePathIgnorePatterns: [
      "/node_modules/",
    ],
    clearMocks: true,
    setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup_e2e.ts"],
    testMatch: [
      "**/*.e2e.test.ts"
    ]
  }
}