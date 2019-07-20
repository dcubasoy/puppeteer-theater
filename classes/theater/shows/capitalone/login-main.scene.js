const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneLoginMainScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: '.error-msg-dd',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        signInHeader: {
          selector: '.signin-header',
        },
        username: {
          selector: '#username',
          visibility: 'optional',
        },
        password: {
          selector: '#password',
          visibility: 'optional',
        },
        signOnBtn: {
          selector: '#id-signin-submit',
          visibility: 'optional',
        },
        rememberMe: {
          selector: '#id-cc-checkbox',
          visibility: 'optional',
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

    if (await this.elements.errors.visible()) {
      const errorMessage = await this.elements.errors.innerText();
      this.log('errorMessage:', errorMessage);
      throw new Error((500, `login-error-${Buffer.from(errorMessage).toString('hex')}`);
    }

    await this.elements.username.fill(this.context('username'));
    await this.elements.password.fill(this.context('password'));

    await this.elements.rememberMe.click();
    await this.elements.signOnBtn.click();
  }
}

module.exports = CapitalOneLoginMainScene;
