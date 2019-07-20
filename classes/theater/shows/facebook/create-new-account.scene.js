const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const FacebokJustClickAwareScene = require('./just-click-aware-scene');

class FacebookCreateNewAccountScene extends FacebokJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        createAccountHeader: {
          selector: '#facebook .\\_ihd',
          match: e => /Create a New Account/.test(e.innerText),
        },
        firstName: {
          selector: 'input[name="firstname"]',
        },
        lastName: {
          selector: 'input[name="lastname"]',
        },
        email: {
          selector: 'input[name="reg_email__"]',
        },
        confirmEmail: {
          selector: '[name="reg_email_confirmation__"]',
        },
        password: {
          selector: 'input[name="reg_passwd__"]',
        },
        dobMonth: {
          selector: '#month',
        },
        dobDay: {
          selector: '#day',
        },
        dobYear: {
          selector: '#year',
        },
        male: {
          selector: '#u_0_a',
        },
        female: {
          selector: '#u_0_9',
        },
        signUpBtn: {
          selector: 'button[type="submit"]',
          match: e => /Sign Up/.test(e.innerText),
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    const spec = this.context('spec');
    const dob = spec.dob.split('/');
    const date = new Date(spec.dob);
    const locale = 'en-us';
    const month = date.toLocaleString(locale, { month: 'short' });

    await this.elements.firstName.fill(spec.firstName);
    await this.elements.lastName.fill(spec.lastName);

    await this.elements.email.fill(spec.email);
    await this.elements.password.fill(spec.password);

    await this.elements.dobMonth.$select(month);
    await this.elements.dobDay.$select(dob[1]);
    await this.elements.dobYear.$select(dob[2]);

    await this.elements.male.check(true);
    await this.elements.signUpBtn.click();
  }
}

module.exports = FacebookCreateNewAccountScene;
