const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');

class ExperianLoginMainScene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: '.container-inline-message.error',
          visibility: 'optional',
          visibilityAreaCheck: true,
        },
        username: {
          selector: '[name="userName"]',
        },
        password: {
          selector: '[name="password"]',
        },
        submitBtn: {
          selector: 'button[data-tms="login-form-signin"]',
        },
        rememberMe: {
          selector: 'label.no-bold',
          visibility: 'optional',
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    const errorMessage = await this.elements.errors.innerText();
    if (errorMessage) {
      this.log('errorMessage:', errorMessage);
    }

    await this.elements.username.fill(this.context('username'));
    await this.elements.password.fill(this.context('password'));
    await this.elements.rememberMe.click();

    await this.elements.submitBtn.click();
  }
}

module.exports = ExperianLoginMainScene;
