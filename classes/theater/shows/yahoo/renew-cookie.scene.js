const PromiseCondition = require('../../promise-condition');
const YahooJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class YahooRenewCookieScene extends YahooJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        challengeFailed: {
          selector: '.fail-challenge,.challenge.session-expired',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
      ],
    }, args));
  }


  async curtainFallen() {
    return super.curtainFallen();
  }

  async match() {
    return PromiseCondition.and(
      super.match(),
    );
  }

  async play() {
    await super.play();
    // re-release bot
    const bot = await this.show.bot();

    this.log('deinit');
    await bot.deinit();

    this.log('reset credential');
    bot.credential = undefined;

    this.log('reset proxy');

    this.log('init');
    await bot.init();
    await bot.page.goto('https://login.yahoo.com/account/create?.lang=en-US&amp;.intl=us&amp;.src=yhelp', { referer: 'https://help.yahoo.com/', waitUntil: 'networkidle0' });
  }
}

module.exports = YahooRenewCookieScene;
