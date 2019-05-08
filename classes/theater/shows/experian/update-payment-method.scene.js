const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class ExperianUpdatePaymentMethodScene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        newCardNumber: {
          selector: '[name="newCreditCard.cardNumber"]',
        },
        newCardCVV: {
          selector: '[name="newCreditCard.cvv"]',
        },
        newCardExpMonth: {
          selector: '[name="newCreditCard.expMonth"]',
        },
        newCardExpYear: {
          selector: '[name="newCreditCard.expYear"]',
        },
        payCurrentBalanceBtn: {
          selector: 'div.form-group.center-block > button',
          visibility: 'optional',
        },
      },
    }, args));
  }


  async curtainFallen() {
    return super.curtainFallen();
  }

  async match() {
    return PromiseCondition.and(
      super.match(),
    );
  }


  async play() {
    await super.play();

    const { CVV, expMonth, expYear, cardNumber } = this.context('card');

    await this.elements.newCardNumber.fill(cardNumber);
    await this.elements.newCardCVV.fill(CVV);
    await this.elements.newCardExpMonth.fill(expMonth);
    await this.elements.newCardExpYear.fill(expYear);
    await this.elements.payCurrentBalanceBtn.click();
  }
}

module.exports = ExperianUpdatePaymentMethodScene;
