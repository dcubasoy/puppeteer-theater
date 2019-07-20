const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalSendMoneyFailureScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        paymentFailureHeader: {
          selector: '#overpanel-root > div:nth-of-type(5) > span:nth-of-type(2) > div > div > div:nth-of-type(3) > div > div > div > div',
          match: e => /we weren't able to complete your payment at this time/.test(e.innerText),
        },
        closeModalBtn: {
          selector: 'span.icon.icon-close-small',
          visibility: 'optional',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(),
        new Scene.Extensions.Click('closeModalBtn'),
      ],
    }, args));
  }

  async play() {
    await super.play();
    this.log('Payment failed!');
  }
}

module.exports = PayPalSendMoneyFailureScene;
