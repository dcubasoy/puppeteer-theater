const PromiseCondition = require('../../promise-condition');const YahooJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class YahooLoginMainScene extends YahooJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: '.error',
          visibility: 'optional',
          visibilityAreaCheck: true,
        },
        username: {
          selector: '#login-username',
        },
        rememberMe: {
          selector: '#persistent',
          visibility: 'optional',
        },
        password: {
          selector: '#login-passwd',
          visibility: 'optional',
        },
        loginBtn: {
          selector: '#login-signin',
          visibility: 'optional',
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
    this.setContinousPlayLimit('errors', 1);

    if (await this.elements.errors.visible()) {
      const errorMessage = await this.elements.errors.innerText();
      this.log('errorMessage:', errorMessage);
    }

    await this.elements.username.fill(this.context('username'));
    await this.elements.rememberMe.check(true);
    await this.elements.loginBtn.click();

    await this.elements.password.fill(this.context('password'));
    await this.elements.loginBtn.click();
  }
}

module.exports = YahooLoginMainScene;
