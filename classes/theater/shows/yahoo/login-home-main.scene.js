const PromiseCondition = require('../../promise-condition');const YahooJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class YahooLoginHomeMainScene extends YahooJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        navMail: {
          selector: '#uh-mail,.yns-container',
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

    const bot = await this.show.bot();
    await bot.goto('https://mail.yahoo.com').catch(() => {});
  }
}

module.exports = YahooLoginHomeMainScene;
