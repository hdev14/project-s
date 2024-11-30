const rootConfig = require("./jest.config.js");

module.exports = {
  ...rootConfig,
  ...{
    displayName: "Coverage",
    coverageThreshold: {
      './src/modules/': {
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
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
