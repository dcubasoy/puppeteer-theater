const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const FacebokJustClickAwareScene = require('./just-click-aware-scene');

class FacebookEmailVerificationConfirmationScene extends FacebokJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        createAccountHeader: {
          selector: 'h2.uiHeaderTitle',
          match: e => /Enter the code from your email/.test(e.innerText),
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }


  async play() {
    await super.play();
    // fill otp code





  }
}

module.exports = FacebookEmailVerificationConfirmationScene;
