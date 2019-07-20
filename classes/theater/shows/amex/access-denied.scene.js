
const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');
const AmexJustClickAwareScene = require('./just-click-aware-scene');

class AmexAccessDeniedScene extends AmexJustClickAwareScene.WithoutSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        navHeaderBlock: {
          selector: 'h1',
          match: e => /Access Denied/.test(e.innerText),
        },
      },
      generic: false,
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    this.log('MFA');
    // re-lease bot
    const bot = await this.show.bot();
    this.log('deinit');
    await bot.deinit();

    this.log('reset chromeUserData');
    bot.credential = undefined;
    bot.chromeUserData = undefined;
    bot.parsedCredential = undefined;

    this.log('init');
    await bot.init();
    bot.goto('https://global.americanexpress.com/account-management').catch(() => {});
  }
}

module.exports = AmexAccessDeniedScene;
