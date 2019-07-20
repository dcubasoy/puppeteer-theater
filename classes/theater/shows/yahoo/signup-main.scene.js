const PromiseCondition = require('../../promise-condition');const YahooJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class YahooSignupMainScene extends YahooJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        signupChallenge: {
          selector: '#account-attributes-challenge',
        },
        firstName: {
          selector: '#usernamereg-firstName',
          visibility: 'optional',
        },
        lastName: {
          selector: '#usernamereg-lastName',
          visibility: 'optional',
        },
        desiredUsername: {
          selector: '#usernamereg-yid',
          visibility: 'optional',
        },
        desiredPassword: {
          selector: '#usernamereg-password',
          visibility: 'optional',
        },
        phone: {
          selector: '#usernamereg-phone',
          visibility: 'optional',
        },
        dobMonth: {
          selector: '#usernamereg-month',
          visibility: 'optional',
        },
        dobDay: {
          selector: '#usernamereg-day',
          visibility: 'optional',
        },
        dobYear: {
          selector: '#usernamereg-year',
          visibility: 'optional',
        },
        gender: {
          selector: '#usernamereg-freeformGender',
          visibility: 'optional',
        },
        submitBtn: {
          selector: '#reg-submit-button',
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
    const spec = this.context('spec');

    const objDate = new Date(spec.dob),
    locale = 'en-us',
    month = objDate.toLocaleString(locale, { month: 'long' });
    const dobDay = objDate.getDay();
    const dobYear = objDate.getYear();

    await this.elements.firstName.fill(spec.firstName);
    await this.elements.lastName.fill(spec.lastName);

    await this.elements.desiredUsername.fill(this.context('tempUsername'));
    await this.elements.desiredPassword.fill(this.context('tempPassword'));
    await this.elements.phone.fill(spec.phone);

    await this.elements.dobMonth.fill(month);
    await this.elements.dobDay.fill(dobDay);
    await this.elements.dobYear.fill(dobYear);
    await this.elements.gender.fill(spec.gender);

    await this.elements.submitBtn.click();
  }
}

module.exports = YahooSignupMainScene;
