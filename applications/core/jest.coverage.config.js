const rootConfig = require("./jest.config.js");

module.exports = {
  ...rootConfig,
  ...{
    displayName: "Coverage",
    collectCoverageFrom: [
      'src/modules/**/*.{ts,js}',
      '!**/node_modules/**',
      '!**/__tests__/**',
      '!**/__mocks__/**',
      '!**/test_utils/**'
    ],
    clearMocks: true,
    setupFilesAfterEnv: ["<rootDir>/src/test_setup.ts"],
    testMatch: [
      "**/*.e2e.test.ts",
      "**/*.int.test.ts",
      "**/*.unit.test.ts"
    ]
  }
}
