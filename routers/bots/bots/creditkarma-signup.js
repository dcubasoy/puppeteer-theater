const TemplateSignInBot = require('./templates/template-bot');
const CreditKarmaShow = require('../../../classes/theater/shows/creditkarma');
const PuppeteerBot = require('../../../classes/puppeteer-bot');
const BotResultReporter = require('../../../classes/bot-result-reporter');
const TheaterLogS3Reporter = require('../../../classes/theater-log-s3-reporter');

const logger = require('../logger');
const utils = require('../utils');
const name = 'creditkarma-signup';

async function runBot(spec) {
  const bot = new PuppeteerBot({
    logger,
    trustChromeNativeRequest: true,
    preferNonHeadless: true,
  });

  let theaterLogReporter;
  let reporter;
  let show;
  try {
    await bot.init();

    show = new CreditKarmaShow({
      Scenes: CreditKarmaShow.SceneSets.SignUp,
      bot,
      logger,
      timeout: 5 * 60 * 1000,
    });

    const email = utils.generateEmail();
    const password = utils.generatePassword(16);

    show.setContext('tempUsername', email);
    show.setContext('tempPassword', password);
    show.setContext('spec', spec);

    reporter = new BotResultReporter({
      show,
      botName: name,
    });

    theaterLogReporter = new TheaterLogS3Reporter({
        show,
        bot,
        logger,
    });

    show.on('showStartPlay', o => theaterLogReporter.onShowStartPlay(o));
    show.on('showEndPlay', o => theaterLogReporter.onShowEndPlay(o));
    show.on('sceneStartPlay', o => theaterLogReporter.onSceneStartPlay(o));
    show.on('sceneEndPlay', o => theaterLogReporter.onSceneEndPlay(o));

    // show.on('creditAccountBotResult', async (o) => { await reporter.onCreditAccountBotResult(o); });

    bot.goto('https://www.creditkarma.com/signup').catch(() => {});

    await show.play();
  } catch (error) {
    logger.error(`runBot-error-${error.message}`, await bot.dump({ error, bypassRateLimit: true }));
  } finally {
    if (theaterLogReporter) await theaterLogReporter.botFreePromise();
    if (reporter) await reporter.botFreePromise();
    await bot.deinit();
  }
}

module.exports = {
  name,
  async run(spec) {
    return runBot(spec);
  },
  router: TemplateSignInBot.router(name),
};
