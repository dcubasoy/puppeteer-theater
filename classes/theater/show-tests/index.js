const fs = require('fs');
const path = require('path');
const createTest = require('./create-test');

fs.readdirSync(path.join(__dirname))
  .filter(f => /\.js$/.test(f))
  .filter(f => !/(create-test|index)\.js$/.test(f))
  // eslint-disable-next-line global-require, import/no-dynamic-require
  .map(p => require(path.join(__dirname, p)));

createTest.runTests();
