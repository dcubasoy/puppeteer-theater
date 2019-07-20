const PromiseCondition = require('../../promise-condition');const AmexJustClickAwareScene = require('./just-click-aware-scene');

class AmexLoginMainScene extends AmexJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: '.alert,#cookieErrMsg',
          visibility: 'optional',
          visibilityAreaCheck: true,
        },
        username: {
          selector: '#eliloUserID',
        },
        password: {
          selector: '#eliloPassword',
        },
        signOnBtn: {
          selector: 'button.btn-fluid',
          match: e => /Log In/.test(e.innerText),
        },
        rememberMe: {
          selector: 'div.checkbox.eliloRemember',
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
      throw new Error((`login-error-${Buffer.from(errorMessage).toString('base64')}`));
    }

    await this.elements.username.fill(this.context('username'));
    await this.elements.password.fill(this.context('password'));

    await this.elements.rememberMe.click();
    await this.elements.signOnBtn.click();
  }
}

module.exports = AmexLoginMainScene;
