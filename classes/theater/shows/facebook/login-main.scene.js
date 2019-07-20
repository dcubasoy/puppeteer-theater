const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const FacebokJustClickAwareScene = require('./just-click-aware-scene');

class FacebookLoginMainScene extends FacebokJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: 'div[role="alert"]',
          match: e => / password you’ve entered is incorrect/.test(e.innerText),
          visibility: 'optional',
        },
        username: {
          selector: '#email',
        },
        password: {
          selector: '#pass',
        },
        loginBtn: {
          selector: '#loginbutton',
        },
      },
      extensions: [
        new Scene.Extensions.PreventCurtainFall({ playCount: 1 }),
        new Scene.Extensions.Delay(),
      ],
      generic: false,
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    this.setContinousPlayLimit('errors', 1);

    await this.elements.username.fill(this.context('username'));
    await this.elements.password.fill(this.context('password'));

    await this.elements.loginBtn.click();
  }
}

module.exports = FacebookLoginMainScene;
