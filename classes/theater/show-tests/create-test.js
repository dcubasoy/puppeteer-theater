const express = require('express');
const path = require('path');
const throat = require('throat');

const PuppeteerBot = require('../../puppeteer-bot');

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
  app.use('/', express.static(path.join(__dirname, './')));
  await new Promise(r => app.listen(PORT, r));

  // specify show to skip in test
  let showTestGrep;
  if (process.env.SHOW_TEST_GREP) {
    showTestGrep = new RegExp(process.env.SHOW_TEST_GREP, 'gi');
  }

  await Promise.all(tests.map(throat(12, async ({ fn, setup }) => {
    const testName = `${setup.Show.name}/${setup.name}`;
    if (showTestGrep && !showTestGrep.test(testName)) {
      process.stdout.write(`Test [${testName}]: skipping\n`);
      return;
    }

    const startedAt = Date.now();
    let testStartedAt;

    const bot = new PuppeteerBot({
      minWidth: 1280,
      minHeight: 1024,
      disguiseFlags: ['--canvas'],
      emulateFlag: 'mobile',
      preferNonHeadless: true,
    });


    try {
      // eslint-disable-next-line no-await-in-loop
      await bot.init();

      const show = new setup.Show({ Scenes: setup.Scenes, bot });

      testStartedAt = Date.now();
      // eslint-disable-next-line no-await-in-loop
      await fn({ show, bot, baseUrl: `http://localhost:${PORT}` });

      process.stdout.write(`Test [${testName}] (${testStartedAt - startedAt}ms prep, ${Date.now() - testStartedAt}ms test): ok\n`);
    } catch (error) {
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
