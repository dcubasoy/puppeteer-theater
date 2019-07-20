const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneCreditWiseEnrollScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        creditImpactHeader: {
          selector: '#precustomer-enrollment-title',
          match: e => /Welcome/.test(e.innerText),
        },
        firstName: {
          selector: '#firstName',
        },
        lastName: {
            selector: '#lastName',
        },
        dob: {
            selector: '#dateOfBirth',
        },
        ssn: {
            selector: '#ssn',
        },
        phone: {
            selector: '#phoneNumber',
        },
        email: {
            selector: '#email',
        },
        address: {
            selector: '[name="enroll.enrollPiForm"] > div:nth-of-type(1) > div:nth-of-type(7) > div.field-enrollment > input.form-input',
        },
        city: {
            selector: '#city',
        },
        state: {
            selector: '#state',
        },
        zip: {
            selector: '#zipCode',
        },
        agreeTerms: {
            selector: '#termsCheckbox',
            visibility: 'optional',
        },
        continueBtn: {
            selector: '#personal-info-continue-button',
            visibility: 'optional',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
      ],
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    const spec = this.context('spec');

    await this.elements.firstName.fill(spec.firstName);
    await this.elements.lastName.fill(spec.lastName);
    await this.elements.dob.fill(spec.dob);
    await this.elements.ssn.fill(spec.ssn);

    await this.elements.phone.fill(spec.phone);
    await this.elements.address.fill(spec.address);
    await this.elements.city.fill(spec.city);
    await this.elements.state.fill(spec.state);
    await this.elements.zip.fill(spec.zip);

    await this.elements.agreeTerms.check(true);
    await this.elements.continueBtn.click();
  }
}

module.exports = CapitalOneCreditWiseEnrollScene;
