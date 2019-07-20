const FacebookShow = require('../../../classes/theater/shows/facebook');
const PuppeteerBot2a = require('../../../classes/puppeteer-bot-2a');
const BotResultReporter = require('../../../classes/bot-result-reporter');
const TheaterLogFirebaseReporter = require('../../../classes/theater-log-firebase-reporter');

const name = 'facebook-signin';

async function runBot(spec) {
  const bot = new PuppeteerBot2a({
    userId: spec.userId,
    preferNonHeadless: true,
  });
  bot.userId = spec.userId;

  let theaterLogReporter;
  let reporter;
  let show;
  try {
    await bot.init();

    show = new FacebookShow({
      Scenes: FacebookShow.SceneSets.SignIn,
      bot,
      timeout: 5 * 60 * 1000,
    });

    show.setContext('userId', spec.userId);
    show.setContext('username', spec.username);
    show.setContext('password', spec.password);


    reporter = new BotResultReporter({
      show,
      userId: spec.userId,
      botName: name,
    });

    theaterLogReporter = new TheaterLogFirebaseReporter({
      show,
      bot,
      userId: spec.userId,
    });

    show.on('showStartPlay', o => theaterLogReporter.onShowStartPlay(o));
    show.on('showEndPlay', o => theaterLogReporter.onShowEndPlay(o));
    show.on('sceneStartPlay', o => theaterLogReporter.onSceneStartPlay(o));
    show.on('sceneEndPlay', o => theaterLogReporter.onSceneEndPlay(o));

    show.on('retailerBotResult', async (o) => {
      await reporter.onRetailerBotResult(o);
    });

    await bot.goto('https://www.facebook.com/login').catch(() => { });

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
