const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PaypPalLoginCaptchaAuthScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        username: {
          selector: '#email',
        },
        captchaImage: {
          selector: '.captcha-image img',
        },
        captcha: {
          selector: '[name="captchaCode"]',
        },
        nextBtn: {
          selector: '#btnNext',
        },
      },
      extensions: [
        new Scene.Extensions.Captcha('captchaImage', 'captcha'),
      ],
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await this.elements.username.fill(this.context('username'));
    await super.play();
    await this.elements.nextBtn.click();
  }
}

module.exports = PaypPalLoginCaptchaAuthScene;
