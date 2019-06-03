const PromiseCondition = require('../../promise-condition');
const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');

class ExperianUpgradeYourAccountScene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: '.ecs-modal .ecs-modal\\__header-text',
          match: e => /Error/.test(e.innerText),
          visibility: 'optional',
          visibilityAreaCheck: true,
        },
        header: {
          selector: '#tt-id-upgrade-header',
          match: e => /Upgrade Your Account/.test(e.innerText),
        },
        orderSummary: {
          selector: '#tt-id-upgrade-order-summary',
        },
        cardNumber: {
          selector: '[name="creditCard.cardNumber"]',
        },
        cvv: {
          selector: '[name="creditCard.cvv"]',
        },
        expMonth: {
          selector: '[name="creditCard.expMonth"]',
        },
        expYear: {
          selector: '[name="creditCard.expYear"]',
        },
        submitBtn: {
          selector: 'button[data-tms="upgrade-offer-submit"]',
        },
        closeModalBtn: {
          selector: 'button[data-ng-bind="config.closeButton.text"]',
          visibility: 'optional',
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    this.setContinousPlayLimit('errors', 1);
    const errorMessage = await this.elements.errors.innerText();
    if (errorMessage) {
      this.log('errorMessage:', errorMessage);
    }

    if (await this.elements.errors.visible()) {
      await this.elements.closeModalBtn.click();
    }

    const summary = await this.elements.orderSummary.innerText();
    this.log('Found order summary: ', summary);

    const { CVV, expMonth, expYear, cardNumber } = this.context('card');
    await this.elements.cardNumber.fill(cardNumber);
    await this.elements.cardCVV.fill(CVV);

    await this.elements.cardExpMonth.fill(expMonth);
    await this.elements.cardExpYear.fill(expYear);

    await this.elements.submitBtn.click();
  }
}

module.exports = ExperianUpgradeYourAccountScene;
