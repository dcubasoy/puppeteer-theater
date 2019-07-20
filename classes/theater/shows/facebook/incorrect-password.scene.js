const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const FacebokJustClickAwareScene = require('./just-click-aware-scene');

class FacebookIncorrectPasswordScene extends FacebokJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        createAccountHeader: {
          selector: '#u_0_9 > div > div.uiHeader.uiHeaderBottomBorder.mhl.mts.uiHeaderPage.interstitialHeader',
          match: e => /Incorrect Password/.test(e.innerText),
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }


  async play() {
    await super.play();
    throw new Error('login-error-incorrect-password');
  }
}

module.exports = FacebookIncorrectPasswordScene;
