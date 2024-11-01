import pluginJs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    },
    ignores: [
      "**/*.d.ts",
      "jest.config.js",
      "jest.unit.config.js",
      "jest.e2e.config.js",
      "jest.coverage.config.js",
      "node_modules/**",
      "tsconfig-paths-bootstrap.js",
      "migration-template.ts",
    ]
  }
];