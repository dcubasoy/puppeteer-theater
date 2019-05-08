const CreditKarmaJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class CreditKarmaInactiveLogoutScene extends CreditKarmaJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        header: {
          selector: 'h1',
          match: e => /For your security, we've logged you out due to inactivity/.test(e.textContent),
        },
        username: {
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
          selector: '#Logon',
        },
      },
    }, args));
  }


  async play() {
    await super.play();

    await this.elements.username.fill(this.context('username'));
    await this.elements.password.fill(this.context('password'));

    await this.elements.rememberMe.check(true);
    await this.elements.loginBtn.click();
  }
}

module.exports = CreditKarmaInactiveLogoutScene;
