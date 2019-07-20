const PromiseCondition = require('../../promise-condition');const CreditKarmaJustClickAwareScene = require('./just-click-aware-scene');

class CreditKarmaWelcomeBackScene extends CreditKarmaJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        welcomeHeader: {
          selector: '#log-on-form-section h3[ck-header]',
          match: e => /Welcome back/.test(e.innerText),
        },
        email: {
          selector: '#username',
        },
        password: {
          selector: '#password',
        },
        rememberMe: {
          selector: '#rememberEmail',
          visibility: 'optional',
        },
        loginBtn: {
          selector: '[ck-button~=blue], input[type=submit][ck-button~=blue]',
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    this.log('Renewing session');

    await this.elements.email.fill(this.context('username'));
    await this.elements.password.fill(this.context('password'));
    await this.elements.rememberMe.check(true);

    await this.elements.loginBtn.click();
  }
}

module.exports = CreditKarmaWelcomeBackScene;
