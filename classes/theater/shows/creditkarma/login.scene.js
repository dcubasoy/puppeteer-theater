const PromiseCondition = require('../../promise-condition');const CreditKarmaJustClickAwareScene = require('./just-click-aware-scene');

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

    this.show.on('creditAccountBotResult', (o) => {
      if (o.status !== 'Linked') return;
      // now we can confirm that username and password pair is good
      this.setContext('username', this.context('tempUsername') || this.context('username'));
      this.setContext('password', this.context('tempPassword') || this.context('password'));
    });
  }


  async play() {
    await super.play();
    this.setContinousPlayLimit('errors', 5);

    if (await this.elements.errors.visible()) {
      const errorMessage = await this.elements.errors.innerText();
      this.log('login-error-message:', errorMessage);
    }

    // support interactive login
    if (!this.context('harvestEnabled') && !this.context('username') || !this.context('password')) {
      this.log('asking for username and password');
      await this.interaction().speak('user', {
        error: errorMessage || undefined,
        tags: [
          {
            tag: 'input',
            type: 'text',
            id: 'username',
            description: 'Creditkarma.com username',
            value: '',
          },
          {
            tag: 'input',
            type: 'text',
            id: 'password',
            description: 'Password',
            value: '',
          },
        ],
      });

      const { username, password } = (await this.interaction().listen('bot')).reply;
      this.setContext('username', username);
      this.setContext('password', password);
    }


    await this.elements.email.fill(this.context('username'));
    await this.elements.password.fill(this.context('password'));
    await this.elements.rememberMe.check(true);
    await this.elements.loginBtn.click();
  }
}

module.exports = CreditKarmaLoginScene;
