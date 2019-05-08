const _ = require('lodash');
const CreditKarmaJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class CreditKarmaCreateAccountStep2Scene extends CreditKarmaJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        firstName: {
          selector: '#fname',
        },
        lastName: {
          selector: '#lname',
        },
        streetAddress: {
          selector: '#locaddr1',
        },
        city: {
          selector: '#loccity',
        },
        state: {
          selector: '#locstate',
        },
        zip: {
          selector: '#loczip',
        },
        dobMonth: {
          selector: '#months',
        },
        dobDay: {
          selector: '#days',
        },
        dobYear: {
          selector: '#years',
        },
        ssnLastFour: {
          selector: '#abc3',
        },
        agreeCheckboxLabel: {
          selector: '#lbl-tacagree',
        },
        agreeCheckbox: {
          selector: '#tacagree',
        },
        btnSubmit: {
          selector: '#submitButton',
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    const spec = _.mapValues(this.context('spec'), _.method('toUpperCase'));
    
    const dob = spec.dob.split('/');
    const ssn = spec.ssn.split('-');

    await this.elements.firstName.fill(spec.firstName);
    await this.elements.lastName.fill(spec.lastName);
    await this.elements.streetAddress.fill(spec.address);
    await this.elements.city.fill(spec.city);

    await this.elements.state.fill(spec.state);
    await this.elements.zip.fill(spec.zip);

    await this.elements.dobMonth.fill(dob[0]);
    await this.elements.dobDay.fill(dob[1]);
    await this.elements.dobYear.fill(dob[2]);

    await this.elements.ssnLastFour.fill(ssn[2]);
    await this.elements.agreeCheckboxLabel.click();
    await this.elements.btnSubmit.click();
  }
}

module.exports = CreditKarmaCreateAccountStep2Scene;
