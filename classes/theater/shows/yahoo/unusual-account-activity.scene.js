const PromiseCondition = require('../../promise-condition');const YahooJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class YahooUnusualAccountActivityScene extends YahooJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        accountActivityHeader: {
          selector: '.txt-align-center',
          match: e => /We've noticed some unusual account activity/.test(e.innerText),
        },
        skipBtn: {
          selector: 'button[name="skip"]',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(1200),
        new Scene.Extensions.Click('skipBtn'),
      ],
    }, args));
  }

  async play() {
    await super.play();
  }
}

module.exports = YahooUnusualAccountActivityScene;
