const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PaypalIntentSelectionScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        getStartedBtn: {
          selector: 'button',
          match: e => /Get Started/.test(e.innerText),
        },
        creditApplyBtn: {
          selector: 'button',
          match: e => /Apply Now/.test(e.innerText),
        },
        addCardContinueBtn: {
          selector: 'button',
          match: e => /Add card to use later/.test(e.innerText),
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
        new Scene.Extensions.Click('addCardContinueBtn'),
      ],
    }, args));
  }

  async play() {
    await super.play();
  }
}

module.exports = PaypalIntentSelectionScene;
