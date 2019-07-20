const PromiseCondition = require('../../promise-condition');const AmexJustClickAwareScene = require('./just-click-aware-scene');

class AmexMobileAppCTAScene extends AmexJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        appHeader: {
          selector: 'a.ytp-title-link.yt-uix-sessionlink',
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(
      super.match(),
    );
  }

  async play() {
    await super.play();
    const bot = await this.show.bot();
    bot.goto('https://global.americanexpress.com/dashboard').catch(() => {});
  }
}

module.exports = AmexMobileAppCTAScene;
