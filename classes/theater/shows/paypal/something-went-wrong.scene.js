const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalSomethingWentWrongScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        challengeHeader: {
          selector: 'h1.headerText',
          match: e => /Something went wrong on our end/.test(e.innerText),
        },
        tryAgainBtn: {
          selector: 'a.button',
          match: e => /Try Again/.test(e.innerText),
        },
      },
      extensions: [
        new Scene.Extensions.Click('tryAgainBtn'),
      ],
    }, args));
  }

  async play() {
    await super.play();
  }
}

module.exports = PayPalSomethingWentWrongScene;
