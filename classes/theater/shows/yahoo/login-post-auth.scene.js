const PromiseCondition = require('../../promise-condition');const YahooJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class YahooLoginPostAuthScene extends YahooJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: '.error-msg',
          visibility: 'optional',
          visibilityAreaCheck: true,
        },
        password: {
          selector: '#login-passwd',
        },
        loginBtn: {
          selector: '#login-signin',
        },
      },
    }, args));
  }

  async curtainFallen() {
    return super.curtainFallen();
  }

  async match() {
    return PromiseCondition.and(
      super.match(),
    );
  }

  async play() {
    await super.play();
    if (await this.elements.errors.visible()) {
      const errorMessage = await this.elements.errors.textContent();
      this.log('errorMessage:', errorMessage);
    }

    await this.elements.password.fill(this.context('password'));
    await this.elements.loginBtn.click();
  }
}

module.exports = YahooLoginPostAuthScene;
