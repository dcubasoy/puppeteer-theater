const ExperianJustClickAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class ExperianCreateAccountStep1Scene extends ExperianJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: '.field-validation-error,.warning',
          visibility: 'optional',
          visibilityAreaCheck: true,
        },
        firstName: {
          selector: '[name="name.first"]',
        },
        lastName: {
          selector: '[name="name.last"]',
        },
        address: {
          selector: '[name="currentAddress.street"]',
        },
        city: {
          selector: '[name="currentAddress.city"]',
        },
        state: {
          selector: '[name="currentAddress.state"]',
        },
        zip: {
          selector: '[name="currentAddress.zip"]',
        },
        phone: {
          selector: '[name="phone"]',
        },
        email: {
          selector: '[name="email"]',
        },
        submitOrderBtn: {
          selector: 'button.ecs-btn.ecs-btn--action.ecs-btn--large',
        },
        purchaseIntent: {
          selector: '[name="purchaseIntentQuestion"]',
        },
        sameAdressCheckbox: {
          selector: '.ecs-form input[type=radio][value="yes"]',
          visibility: 'optional',
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    const spec = this.context('spec');

    const errorMessage = await this.elements.errors.innerText();
    if (errorMessage) {
      this.log('errorMessage:', errorMessage);
    }

    await this.elements.firstName.fill(spec.firstName.toUpperCase());
    await this.elements.lastName.fill(spec.lastName.toUpperCase());

    await this.elements.address.fill(spec.address.toUpperCase());
    await this.elements.city.fill(spec.city.toUpperCase());
    await this.elements.state.$select(spec.state);
    await this.elements.zip.fill(spec.zip);

    await this.elements.sameAdressCheckbox.check(true);
    await this.elements.phone.fill(spec.phone);
    await this.elements.email.fill(this.context('tempEmail'));

    await this.elements.purchaseIntent.fill('Checking my report or score for accuracy');
    await this.elements.submitOrderBtn.click();
  }
}

module.exports = ExperianCreateAccountStep1Scene;
