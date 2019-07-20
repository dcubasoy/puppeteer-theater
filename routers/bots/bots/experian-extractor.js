/* eslint-disable no-unused-vars */
const _ = require('lodash');
const ExperianShow = require('../../../classes/theater/shows/experian');
const PuppeteerBot2a = require('../../../classes/puppeteer-bot-2a');

const BotResultReporter = require('../../../classes/bot-result-reporter');
const TheaterLogFirebaseReporter = require('../../../classes/theater-log-firebase-reporter');
const createLogger = require('../../../utils/logger');

const name = 'experian-extractor';
const logger = createLogger(name);

async function runBot(spec) {
  const bot = new PuppeteerBot2a({
    userId: spec.userId,
    logger,
    preferNonHeadless: true,
  });
  bot.userId = spec.userId;

  let theaterLogReporter;
  let reporter;
  let show;
  try {
    await bot.init();

    show = new ExperianShow({
      Scenes: ExperianShow.SceneSets.ExtractReport,
      bot,
      logger,
      timeout: 5 * 60 * 1000,
    });

    show.setContext('userId', spec.userId);
    show.setContext('username', spec.username);
    show.setContext('password', spec.password);


    reporter = new BotResultReporter({
      show,
      userId: spec.userId,
      logger,
      botName: name,
    });

    theaterLogReporter = new TheaterLogFirebaseReporter({
      show,
      bot,
      userId: spec.userId,
      logger,
    });


    show.on('showStartPlay', o => theaterLogReporter.onShowStartPlay(o));
    show.on('showEndPlay', o => theaterLogReporter.onShowEndPlay(o));
    show.on('sceneStartPlay', o => theaterLogReporter.onSceneStartPlay(o));
    show.on('sceneEndPlay', o => theaterLogReporter.onSceneEndPlay(o));

    show.on('creditAccountBotResult', async (o) => { await reporter.onCreditAccountBotResult(o); });
    show.on('creditDocumentBotResult', async (o) => { await reporter.onCreditDocumentBotResult(o); });

    bot.goto('https://usa.experian.com/#/financialProfile').catch(() => {});

    await show.play();
  } catch (error) {
    console.error(`runBot-error-${error.message}`, await bot.dump());
  } finally {
    if (theaterLogReporter) await theaterLogReporter.botFreePromise();
    if (reporter) await reporter.botFreePromise();
    await bot.deinit();
  }
}

module.exports = {
  name,
  lazy: true,
  async run(spec) {
    return runBot(spec);
  },
};
