const Scene = require('../../scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class ExperianUpgradeAccountMembershipScene extends Scene {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        orderSummary: {
          selector: 'header.small',
          match: e => /Your Order Summary/.test(e.textContent),
        },
        pricingTable: {
          selector: '.table-pricing',
        },
        submitOrderBtn: {
          selector: '#tt-id-upgrade-order-button > button',
        },
        cardNumber: {
          selector: '#tt-id-upgrade-billing-info > div > div > ecs-credit-card > div > div > div.form-group.card-number-container > div > input',
          visibility: 'optional',
        },
        cardCVV: {
          selector: '#tt-id-upgrade-billing-info > div > div > ecs-credit-card > div > div > div.form-group.cvv-container > div > div.cvv-input-container > div > input',
          visibility: 'optional',
        },
        cardExpMonth: {
          selector: '#tt-id-upgrade-billing-info > div > div > ecs-credit-card > div > div > div.form-group.exp-without-primary > div > div.exp-month-container > select',
          visibility: 'optional',
        },
        cardExpYear: {
          selector: '#tt-id-upgrade-billing-info > div > div > ecs-credit-card > div > div > div.form-group.exp-without-primary > div > div.exp-year-container > select',
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
    this.log('Upgrading Experian Membership tier...');

    const pricing = await this.elements.pricingTable.innerTexts();
    this.log('Found pricing details', pricing);

    const { CVV, expMonth, expYear, cardNumber } = this.context('card');
    await this.elements.cardNumber.fill(cardNumber);
    await this.elements.cardCVV.fill(CVV);

    await this.elements.cardExpMonth.fill(expMonth);
    await this.elements.cardExpYear.fill(expYear);
    await this.elements.submitOrderBtn.click();
  }
}

module.exports = ExperianUpgradeAccountMembershipScene;
