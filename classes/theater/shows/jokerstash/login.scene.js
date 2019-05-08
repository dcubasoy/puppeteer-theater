const Scene = require('../../scene');
const PromiseCondition = require('../../../../utils/promise-condition');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');

class JokerLoginScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: 'ul.\\_errors',
          visibility: 'optional',
          visibilityAreaCheck: true,
        },
        username: {
          selector: '#login',
        },
        password: {
          selector: '#password',
        },
        captcha: {
          selector: '#captcha',
        },
        captchaImage: {
          selector: 'img.\\_captcha',
        },
        loginBtn: {
          selector: 'button',
          match: e => /Log in/.test(e.innerText),
        },
      },
      extensions: [
        new Scene.Extensions.Captcha('captchaImage', 'captcha'),
      ],
    }, args));
  }

  async play() {
    if (await this.elements.errors.visible()) {
      const errorMessage = await this.elements.errors.innerText();
      this.log('login-error-message:', errorMessage);
    }

    await this.elements.username.fill(this.context('username'));
    await this.elements.password.fill(this.context('password'));
    await super.play();

    await this.elements.loginBtn.click();
  }
}

module.exports = JokerLoginScene;
