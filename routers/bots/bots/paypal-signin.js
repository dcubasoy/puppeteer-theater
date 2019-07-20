const PayPalShow = require('../../../classes/theater/shows/paypal');
const PuppeteerBot2a = require('../../../classes/puppeteer-bot-2a');

const BotResultReporter = require('../../../classes/bot-result-reporter');
const name = 'paypal-signin';

async function runBot(spec) {
  const bot = new PuppeteerBot2a({
    trustChromeNativeRequest: true,
    preferNonHeadless: true,
  });

  bot.userId = spec.userId;

  let theaterLogReporter;
  let reporter;
  let show;
  try {
    await bot.init();

    show = new PayPalShow({
      Scenes: PayPalShow.SceneSets.SignIn,
      bot,
    });

    show.setContext('userId', spec.userId);
    show.setContext('username', spec.username);
    show.setContext('password', spec.password);

    reporter = new BotResultReporter({
      show,
      userId: spec.userId,
      botName: name,
    });

    theaterLogReporter = new TheaterLogS3Reporter({
      show,
      bot,
      userId: spec.userId,
    });


    show.on('showStartPlay', o => theaterLogReporter.onShowStartPlay(o));
    show.on('showEndPlay', o => theaterLogReporter.onShowEndPlay(o));
    show.on('sceneStartPlay', o => theaterLogReporter.onSceneStartPlay(o));
    show.on('sceneEndPlay', o => theaterLogReporter.onSceneEndPlay(o));

    show.on('retailerBotResult', o => reporter.onRetailerBotResult(o));
    await bot.page.goto('https://www.paypal.com/signin', { referer: 'https://www.paypal.com', waitUntil: 'networkidle0' });
    await show.play();
  } catch (error) {
    logger.error(`runBot-error-${error.message}`, await bot.dump({
      error,
      bypassRateLimit: true,
    }));
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