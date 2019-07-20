const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalSignupStep2Scene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        mainForm: {
          selector: '#PageMainForm',
        },
        streetAddress: {
          selector: '#paypalAccountData_address1,#paypalAccountData_addressSuggest',
          visibility: 'optional',
        },
        city: {
          selector: '#paypalAccountData_city',
          visibility: 'optional',
        },
        state: {
          selector: '#paypalAccountData_state',
          visibility: 'optional',
        },
        zip: {
          selector: '#paypalAccountData_zip',
          visibility: 'optional',
        },
        phone: {
          selector: '#paypalAccountData_phone',
          visibility: 'optional',
        },
        agreeCheckbox: {
          selector: '#paypalAccountData_tcpa',
          visibility: 'optional',
        },
        createAccountBtn: {
          selector: 'button[value="submit_account_create"]',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
        new Scene.Extensions.PreventCurtainFall({playCount: 1}),
      ],
      generic: false,
    }, args));
  }


  async play() {
    await super.play();
    const spec = this.context('spec');

    await this.elements.streetAddress.fill(spec.address);
    await this.elements.city.fill(spec.city);
    await this.elements.state.fill(spec.state);
    await this.elements.zip.fill(spec.zip);
    await this.elements.phone.fill(spec.phone);

    await this.elements.agreeCheckbox.check(true);
    await this.elements.createAccountBtn.click();
  }
}

module.exports = PayPalSignupStep2Scene;
