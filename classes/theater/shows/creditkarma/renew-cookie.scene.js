const Scene = require('../../scene');
const CreditKarmaJustClickAwareScene = require('./just-click-aware-scene');

const utils = require('../../../../routers/bots/utils');

class CreditKarmaRenewCookieScene extends CreditKarmaJustClickAwareScene.WithoutSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        beRightBackHeader: {
          selector: 'body > main > section > h2',
          match: e => /Be Right Back/.test(e.innerText),
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
      ],
    }, args));
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
    if (this.context('signupEnabled')) {
      bot.goto('https://www.creditkarma.com/signup').catch(() => {});
    }

    if (this.context('harvestEnabled')) {
      bot.goto('https://www.creditkarma.com/myfinances/creditreport/transunion/view/print#overview').catch(() => {});
    }
  }
}

module.exports = CreditKarmaRenewCookieScene;
