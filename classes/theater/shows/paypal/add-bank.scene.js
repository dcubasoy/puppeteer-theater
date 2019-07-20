const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PaypalAddBankScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: '.vx_has-error-with-message',
          visibility: 'optional',
          visibilityAreaCheck: true,
        },
        addBankHeader: {
          selector: 'h1',
          match: e => /Link your bank account to send money for free/.test(e.innerText),
        },
        checkingAccount: {
          selector: 'input[value="Checking"]',
        },
        savingsAccount: {
          selector: 'input[value="Savings"]',
        },
        s: {
          selector: '#paypalBankData_routingNumber',
        },
        accountNumber: {
          selector: '#paypalBankData_accNumber',
        },
        linkBtn: {
          selector: '.vx_btn.vx_btn-block',
          match: e => /Link Bank/.test(e.innerText),
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match(), this.context('linkBank'));
  }

  async play() {
    await super.play();
    const errorMessage = await this.elements.errors.innerText();
    if (errorMessage) {
      this.log('errorMessage:', errorMessage);
    }

    const spec = this.context('spec');
    await this.elements.accountNumber.fill(spec.accountNumber);
    await this.elements.routingNumber.fill(spec.routingNumber);
  }
}

module.exports = PaypalAddBankScene;
