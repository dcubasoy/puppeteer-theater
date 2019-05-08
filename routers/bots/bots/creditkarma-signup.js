const CreditKarmaShow = require('../../../classes/theater/shows/creditkarma');
const PuppeteerBot = require('../../../classes/puppeteer-bot');

const TheaterLogFirebaseReporter = require('../../../classes/theater-log-firebase-reporter');

const name = 'creditkarma-signup';

async function runBot(spec) {
  const bot = new PuppeteerBot({
    trustChromeNativeRequest: true,
    preferNonHeadless: true,
  });
  bot.userId = spec.profileId;

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

    const email = await utils.generateEmail(spec.firstName);
    const password = utils.generatePassword(16);

    show.setContext('tempUsername', email);
    show.setContext('tempPassword', password);
    show.setContext('spec', spec);

    reporter = new BotResultReporter({
      show,
      userId: spec.profileId,
      logger,
      botName: name,
    });

    theaterLogReporter = new TheaterLogFirebaseReporter({
      show,
      bot,
      userId: spec.profileId,
      logger,
    });

    show.on('showStartPlay', o => theaterLogReporter.onShowStartPlay(o));
    show.on('showEndPlay', o => theaterLogReporter.onShowEndPlay(o));
    show.on('sceneStartPlay', o => theaterLogReporter.onSceneStartPlay(o));
    show.on('sceneEndPlay', o => theaterLogReporter.onSceneEndPlay(o));
    show.on('creditAccountBotResult', async (o) => { await reporter.onCreditAccountBotResult(o); });

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
  lazy: true,
  async run(spec) {
    return runBot(spec);
  },
  router: TemplateSignInBot.router(name),
};
