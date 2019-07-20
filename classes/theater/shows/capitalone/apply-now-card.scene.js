const _ = require('lodash');
const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneApplyNowCardScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        firstName: {
          selector: '#firstName',
        },
        lastName: {
          selector: '#lastName',
        },
        dateOfBirth: {
          selector: '#dateOfBirth',
        },
        ssn: {
          selector: '#socialSecurityNumber',
        },
        citizenYes: {
          selector: '#citizenYes',
        },
        address: {
          selector: '#combinedStreetAddress',
        },
        email: {
          selector: '#email',
        },
        phone: {
          selector: '#phoneNumber',
        },
        checkingOrSavings: {
          selector: '#checkingOrSavings_input > div.rw-widget-input.rw-widget-picker.rw-widget-container > div.rw-input.rw-dropdown-list-input',
        },
        employmentStatus: {
          selector: '#employmentStatus_input > div.rw-widget-input.rw-widget-picker.rw-widget-container > div.rw-input.rw-dropdown-list-input',
        },
        jobTitle: {
          selector: '#occupation',
          visibility: 'optional',
        },
        annualIncome: {
          selector: '#annualIncome',
        },
        monthlyRent: {
          selector: '#monthlyRentMortgage',
        },
        cashAdvanceNo: {
          selector: '#cashAdvanceNo',
        },
        reviewedDisclosures: {
          selector: 'span.nub-esign',
        },
        continueBtn: {
          selector: '#continueToSubmit',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
      ],
    }, args));
  }

  async play() {
    await super.play();
    const spec = this.context('spec');

    await this.elements.firstName.fill(spec.firstName);
    await this.elements.lastName.fill(spec.lastName);

    await this.elements.dateOfBirth.fill(spec.dob);
    await this.elements.ssn.fill(spec.ssn);
    await this.elements.citizenYes.check(true);

    await this.elements.address.fill(spec.address);
    await this.elements.email.fill(spec.email);
    await this.elements.phone.fill(spec.phone);

    await this.elements.checkingOrSavings.fill('Checking Only');
    await this.elements.employmentStatus.fill('Employed');
    await this.elements.jobTitle.fill(spec.jobTitle);

    await this.elements.annualIncome.fill(spec.totalGrossIncome);
    await this.elements.monthlyRent.fill(_.random(2000, 25000).toString());
    await this.elements.reviewedDisclosures.check(true);

    await this.elements.continueBtn.click();
  }
}

module.exports = CapitalOneApplyNowCardScene;
