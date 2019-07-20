
const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const AmexJustClickAwareScene = require('./just-click-aware-scene');

class AmexCheckGiftCardBalanceScene extends AmexJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        navHeaderBlock: {
          selector: '.simple-decision',
          match: e => /We're sorry/ig.test(e.innerText),
        },
        reviewApplicationDetails: {
          selector: 'h4 > a',
          visibility: 'optional',
        },
      },
      generic: false,
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }


  async curtainFallen() {
    return PromiseCondition.and(super.curtainFallen(), this.context('digitalData'));
  }


  async getDigitalData() {
    const bot = await this.show.bot();
    return bot.page.evaluate(() => {
      // eslint-disable-next-line no-undef
      return (JSON.parse(window.digitalData) || {})
    });
  }

  async play() {
    await super.play();
    this.log('Denied');

    const metadata = await this.getDigitalData();
    this.log('Got application metadata', metadata);

    this.show.emit('creditBotResult', { status: 'DENIED', meta: metadata });
    this.setContext('digitalData', metadata);
  }
}

module.exports = AmexCheckGiftCardBalanceScene;
