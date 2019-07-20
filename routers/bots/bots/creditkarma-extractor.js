const CreditKarmaShow = require('../../../classes/theater/shows/creditkarma');
const PuppeteerBot2a = require('../../../classes/puppeteer-bot-2a');

const BotResultReporter = require('../../../classes/bot-result-reporter');
const TheaterLogFirebaseReporter = require('../../../classes/theater-log-firebase-reporter');


const name = 'creditkarma-extractor';

async function runBot(spec) {

  const bot = new PuppeteerBot2a({
    trustChromeNativeRequest: true,
    credential: spec.session, // this will clone all session/userData
  });

  bot.userId = spec.userId;

  let theaterLogReporter;
  let reporter;
  let show;
  try {
    await bot.init();

    show = new CreditKarmaShow({
      Scenes: CreditKarmaShow.SceneSets.ExtractReport,
      bot,
      timeout: 2 * 60 * 1000,
    });

    show.setContext('harvestEnabled', true);
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

    show.on('creditDocumentBotResult', async (o) => { await reporter.onCreditDocumentBotResult(o); });

    bot.goto('https://www.creditkarma.com/myfinances/creditreport/transunion/view/print#overview').catch(() => { });

    await show.play();
  } catch (error) {
    console.error(`runBot-error-${error.message}`, await bot.dump());
    return { error: error.message };
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
};
