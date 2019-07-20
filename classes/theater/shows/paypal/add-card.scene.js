const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PaypalAddCardScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        getStartedBtn: {
          selector: 'h1',
          match: e => /Add a card to shop or send money later/.test(e.innerText),
        },
        cardNumber: {
          selector: '#cardData_cardNumber',
        },
        expDate: {
          selector: '#cardData_expiryDate',
        },
        cvv: {
          selector: '#cardData_csc',
        },
        linkCardBtn: {
          selector: '.vx_btn-block',
          match: e => /Link Card/.test(e.innerText),
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    const spec = this.context('spec');

    await this.elements.cardNumber.fill(spec.cardNumber);
    await this.elements.expDate.fill(`${spec.expMonth}/${spec.expYear.slice(-2)}`);
    await this.elements.cvv.fill(spec.cvv);

    await this.elements.linkCardBtn.click();
  }
}

module.exports = PaypalAddCardScene;
