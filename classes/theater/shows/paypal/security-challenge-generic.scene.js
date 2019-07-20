const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalSecurityChallengeGenericScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        challengeHeader: {
          selector: 'h1.headerText',
          match: e => /Security Challenge/.test(e.innerText),
        },
        captchaImg: {
          selector: 'img',
        },
        captchaAnswer: {
          selector: '#captchaCode',
        },
        continueBtn: {
          selector: '#continue',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(),
        new Scene.Extensions.Captcha('captchaImg', 'captchaAnswer'),
      ],
    }, args));
  }

  async play() {
    await super.play();
    await this.elements.continueBtn.click();
  }
}

module.exports = PayPalSecurityChallengeGenericScene;
