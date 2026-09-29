require('ts-node').register({
  transpileOnly: true,
  // Ensure the compiler treats files as CommonJS modules
  compilerOptions: { module: 'commonjs' }
});
module.exports = require('./admin.ts');
