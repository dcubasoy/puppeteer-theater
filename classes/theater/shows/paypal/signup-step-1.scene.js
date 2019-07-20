const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalSignupStep1Scene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        signupHeader: {
          selector: '.signup-page-form',
        },
        firstName: {
          selector: '#paypalAccountData_firstName',
        },
        lastName: {
          selector: '#paypalAccountData_lastName',
        },
        email: {
          selector: '#paypalAccountData_email',
        },
        password: {
          selector: '#paypalAccountData_password',
        },
        nextBtn: {
          selector: 'button[type="submit"]',
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    const spec = this.context('spec');

    await this.elements.firstName.fill(spec.firstName);
    await this.elements.lastName.fill(spec.lastName);
    await this.elements.email.fill(spec.email);
    await this.elements.password.fill(spec.password);

    await this.elements.nextBtn.click();
  }
}

module.exports = PayPalSignupStep1Scene;
