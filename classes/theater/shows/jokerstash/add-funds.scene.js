const Scene = require('../../scene');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class JokerStashAddFundsScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        addFundsHeader: {
          selector: 'h1',
          match: e => /Add Funds/.test(e.innerText),
        },
        bitcoin: {
          selector: 'p > a:nth-of-type(1)',
        },
        checkForPaymentBtn: {
          selector: 'a.check-coin',
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    await this.elements.bitcoin.click();

    this.log('Topping up balance...');
  }
}

module.exports = JokerStashAddFundsScene;
