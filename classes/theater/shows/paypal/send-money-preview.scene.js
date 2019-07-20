const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalSendMoneyPreviewScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        paymentAmount: {
          selector: '#fn-amount',
        },
        sendMoneyBtn: {
          selector: 'button.vx_btn.preview-getFundingOptions.preview-sendMoney',
          visibility: 'optional',
        },
      },
    }, args));
  }


  async play() {
    await super.play();
    const spec = this.context('spec');

    await this.elements.paymentAmount.fill(spec.paymentAmount);
    await this.elements.sendMoneyBtn.click();
  }
}

module.exports = PayPalSendMoneyPreviewScene;
