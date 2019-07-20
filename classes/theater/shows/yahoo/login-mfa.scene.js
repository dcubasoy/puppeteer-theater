const PromiseCondition = require('../../promise-condition');const YahooJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class YahooLoginMFAScene extends YahooJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        challenge: {
          selector: '#phone-obfuscation-challenge,.authorize-verify-code-container',
          visibility: 'optional',
        },
        header: {
          selector: '.challenge-heading',
          visibility: 'optional',
        },
        verifyDigits: {
          selector: 'input[name="verifyDigits"]',
          visibility: 'optional',
        },
        pushChallenge: {
          selector: 'push-challenge',
          visibility: 'optional',
        },
      },
    }, args));
  }

  async curtainFallen() {
    return super.curtainFallen();
  }

  async match() {
    return PromiseCondition.or(
      this.elements.challenge.visible(),
      this.elements.header.visible(),
    );
  }

  async play() {
    await super.play();
    this.setContinousPlayLimit('challenge', 1);
    this.setContinousPlayLimit('header', 1);

    this.log('MFA');
    this.show.emit('retailerBotResult', {
      status: 'MFA',
    });
    throw new Error('MFA');
  }
}

module.exports = YahooLoginMFAScene;
