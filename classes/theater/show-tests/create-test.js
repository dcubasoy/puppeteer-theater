const express = require('express');
const path = require('path');
const throat = require('throat');

const admin = require('firebase-admin');
const serviceAccount = require('../../../config/firebase-admin-secure.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_URI,
});
const app = express();

const PORT = 27378;
const tests = [];
let defaultSetup;

async function test(testSetup, fn) {
  const setup = Object.assign(Object.assign({}, defaultSetup), testSetup);
  tests.push({ setup, fn });
}

const NOP = () => {};

const logger = () => ({
  error(e) { process.stderr.write(`${e.stack}\n`); },
  warn: NOP,
  info: NOP,
  verbose: NOP,
  debug: NOP,
});

async function runTests() {
  // eslint-disable-next-line global-require
  const PuppeteerBot2a = require('../../puppeteer-bot-2a');
  app.use('/', express.static(path.join(__dirname, './')));
  await new Promise(r => app.listen(PORT, r));

  let showTestGrep;
  if (process.env.SHOW_TEST_GREP) {
    showTestGrep = new RegExp(process.env.SHOW_TEST_GREP, 'gi');
  }

  await Promise.all(tests.map(throat(8, async ({ fn, setup }) => {
    const testName = `${setup.Show.name}/${setup.name}`;
    if (showTestGrep && !showTestGrep.test(testName)) {
      process.stdout.write(`Test [${testName}]: skipping\n`);
      return;
    }

    const startedAt = Date.now();
    let testStartedAt;
    const bot = new PuppeteerBot2a({
      preferNonHeadless: true,
    });


    try {
      // eslint-disable-next-line no-await-in-loop
      await bot.init();

      const show = new setup.Show({ Scenes: setup.Scenes, bot });
      bot.interceptRequest = show.interceptRequest;

      testStartedAt = Date.now();
      // eslint-disable-next-line no-await-in-loop
      await fn({ show, bot, baseUrl: `http://localhost:${PORT}` });

      process.stdout.write(`Test [${testName}] (${testStartedAt - startedAt}ms prep, ${Date.now() - testStartedAt}ms test): ok\n`);
    } catch (error) {
      console.trace(error);
      process.stderr.write(`Test [${testName}] (${testStartedAt - startedAt}ms prep, ${Date.now() - testStartedAt}ms test): ${error.stack}\n`);
      process.exit(1);
    } finally {
      // eslint-disable-next-line no-await-in-loop
      await bot.deinit();
    }
  })));

  process.exit(0);
}

module.exports = (setup, fn) => {
  defaultSetup = setup;
  fn(test);
};

module.exports.runTests = async () => {
  await runTests();
};
