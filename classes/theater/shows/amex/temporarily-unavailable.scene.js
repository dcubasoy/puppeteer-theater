const PromiseCondition = require('../../promise-condition');const AmexJustClickAwareScene = require('./just-click-aware-scene');

class AmexTemporarilyUnavailableScene extends AmexJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        appHeader: {
          selector: '#gnrBody > table:nth-child(25) > tbody > tr:nth-child(2) > td',
          match: e => /Our systems are currently updating/ig.test(e.innerText),
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
    this.log('AmericanExpress: Temporarily Unavailable!!');

    const bot = await this.show.bot();
    bot.goto('https://global.americanexpress.com/dashboard').catch(() => {});
  }
}

module.exports = AmexTemporarilyUnavailableScene;






