const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalAccountSelectionScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        personalAccount: {
          selector: '#radio-personal',
          visibility: 'optional',
        },
        nextBtn: {
          selector: '#cta-btn',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(),
        new Scene.Extensions.Click('nextBtn'),
      ],
    }, args));
  }

  async play() {
    await super.play();
  }
}

module.exports = PayPalAccountSelectionScene;
