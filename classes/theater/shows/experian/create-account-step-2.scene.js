const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../promise-condition');

class ExperianCreateAccountStep2Scene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: '.field-validation-error,.ecs-media.warning',
          visibility: 'optional',
          visibilityAreaCheck: true,
        },
        ssn: {
          selector: '#siteContent > div > div.row > div:nth-child(1) > div > form > div > div > div > div.form-group.ecs-ssn.ng-scope.ng-isolate-scope > div > label > input',
          visibility: 'optional',
        },
        lastFourSSN: {
          selector: 'input[name="lastFourSsn"]',
          visibility: 'optional',
        },
        showSSN: {
          selector: 'label.no-bold',
          visibility: 'optional',
        },
        dobMonth: {
          selector: '[name="dob.month"]',
        },
        dobDay: {
          selector: '[name="dob.day"]',
        },
        dobYear: {
          selector: '[name="dob.year"]',
        },
        usernameInput: {
          selector: '[name="userName"]',
        },
        passwordInput: {
          selector: '[name="password"]',
        },
        confirmPassword: {
          selector: '[name="confirmPassword"]',
        },
        submitOrderBtn: {
          selector: 'button.ecs-btn.ecs-btn--action.ecs-btn--large',
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(
      super.match(),
    );
  }

  async play() {
    await super.play();
    this.setContinousPlayLimit('errors', 10);
    const errorMessage = await this.elements.errors.innerText();
    if (errorMessage) {
      this.log('errorMessage:', errorMessage);
      // if error message presents, persist attempting
      this.setContext('signupError', errorMessage);
      await this.elements.submitOrderBtn.click();
    }

    const spec = this.context('spec');
    const dob = spec.dob.split('/');
    const ssn = spec.ssn.split('-');
    const socialsecuritynumber = spec.ssn.replace(/-/g, '');

    const dobYear = parseInt(dob[2], 10).toString();
    const dobDay = parseInt(dob[1], 10).toString();
    const date = new Date(spec.dob);
    const locale = 'en-us';
    const month = date.toLocaleString(locale, { month: 'long' });

    await this.elements.dobMonth.fill(month);
    await this.elements.dobDay.fill(dobDay);
    await this.elements.dobYear.fill(dobYear);
    await this.elements.showSSN.click();

    if (await this.elements.lastFourSSN.visible()) {
      await this.elements.lastFourSSN.fill(ssn[2]);
    } else {
      // re-release bot
      const bot = await this.show.bot();
      await bot.page.type('#siteContent > div > div > div:nth-child(1) > div > form > div > div > div > div.form-group.ecs-ssn.ng-scope.ng-isolate-scope > div > label > input', socialsecuritynumber, { delay: 225 });
    }


    await this.elements.usernameInput.fill(this.context('tempUsername'));
    await this.elements.passwordInput.fill(this.context('tempPassword'));
    await this.elements.confirmPassword.fill(this.context('tempPassword'));

    await this.elements.submitOrderBtn.click();
  }
}

module.exports = ExperianCreateAccountStep2Scene;
