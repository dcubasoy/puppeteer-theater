const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalAccountWalletScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        paymentMethodsHeader: {
          selector: 'h5.fiListGroup-headerContent',
          match: e => /PAYMENT METHODS/.test(e.textContent),
        },
        activityNav: {
          selector: '#header-activity',
        },
        paymentMethods: {
          selector: '.fiListItem-row table-row',
          visibility: 'optional',
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();

    const paymentMethods = await this.elements.paymentMethods.innerText();
    this.log('Found payment methods: ', paymentMethods);

    await this.elements.activityNav.click({ once: true });
  }
}

module.exports = PayPalAccountWalletScene;
