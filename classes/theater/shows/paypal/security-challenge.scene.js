const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalSecurityChallengeScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        challengeHeader: {
          selector: '.headerText',
          match: e => /Security Challenge/.test(e.innerText),
        },
        recaptcha: {
          selector: '#recaptcha',
        },
      },
      extensions: [
        new Scene.Extensions.PreventCurtainFall({playCount: 1}),
        new Scene.Extensions.Delay(),
        new Scene.Extensions.ReCAPTCHAv2('recaptcha', () => '6LepHQgUAAAAAFOcWWRUhSOX_LNu0USnf7Vg6SyA'),
      ],
      generic: false,
    }, args));
  }

  async play() {
    await super.play();
  }
}

module.exports = PayPalSecurityChallengeScene;
