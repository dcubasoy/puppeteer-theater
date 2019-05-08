const PromiseCondition = require('../../../../utils/promise-condition');
const CreditKarmaJustClickAwareScene = require('./just-click-aware-scene');

class CreditKarmaLoginScene extends CreditKarmaJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: '[ck-message]',
          visibility: 'optional',
        },
        loginHeader: {
          selector: 'body.auth-logon #log-on-form-section header [ck-header], body.auth-logon .log-back-section header [ck-header]',
          match: e => /Log In to Credit Karma/.test(e.innerText),
        },
        email: {
          selector: '#username',
        },
        password: {
          selector: '#password',
        },
        loginBtn: {
          selector: 'body.auth-logon #log-on-form-section [ck-button], body.auth-logon .log-back-section [ck-button]',
        },
        rememberMe: {
          selector: '#rememberEmail',
        },
      },
    }, args));
  }


  async play() {
    await super.play();
    this.setContinousPlayLimit('errors', 10);

    if (await this.elements.errors.visible()) {
      const errorMessage = await this.elements.errors.innerText();
      this.log('errorMessage:', errorMessage);
    }

    await this.elements.email.fill(this.context('username'));
    await this.elements.password.fill(this.context('password'));
    await this.elements.rememberMe.check(true);
    await this.elements.loginBtn.click();
  }
}

module.exports = CreditKarmaLoginScene;
