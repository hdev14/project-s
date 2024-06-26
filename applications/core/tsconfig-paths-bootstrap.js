/* eslint-disable import/no-extraneous-dependencies */
const tsconfigPaths = require('tsconfig-paths');
const tsconfig = require('./tsconfig.build.json');

const baseUrl = './build';

tsconfigPaths.register({
  baseUrl,
  paths: tsconfig.compilerOptions.paths,
});