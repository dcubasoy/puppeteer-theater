const PromiseCondition = require('../../promise-condition');const utils = require('../../../../routers/bots/utils');
const YahooJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class YahooRenewSessionScene extends YahooJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        failedAttemptsHeader: {
          selector: 'h2.writeup.bold',
          match: e => /Too many failed attempts/.test(e.innerText),
        },
        failedAttemptsErrorDetail: {
          selector: 'div.writeup.sml-txt.description > p',
          match: e => /We're not able to create an account for you/.test(e.innerText),
        },
        startOverBtn: {
          selector: 'a.pure-button.puree-button-primary.puree-spinner-button.try-again',
        },
      },
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

    this.log('reset proxy');

    this.log('init');
    await bot.init();
    await bot.page.goto('https://login.yahoo.com/account/create?.lang=en-US&amp;.intl=us&amp;.src=yhelp', { referer: 'https://help.yahoo.com/', waitUntil: 'networkidle0' });

    await bot.waitForNavigation();
  }
}

module.exports = YahooRenewSessionScene;
