const ey = require('@nicomee/bt_backend-core');

const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalLoginMainScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: '.notification.notification-critical',
          visibility: 'optional',
          visibilityAreaCheck: true,
        },
        email: {
          selector: '#email',
        },
        password: {
          selector: '#password',
          visibility: 'optional',
        },
        nextBtn: {
          selector: '#btnNext',
          visibility: 'optional',
        },
        loginBtn: {
          selector: '#btnLogin',
          visibility: 'optional',
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    this.setContinousPlayLimit('errors', 1);
    const bot = await this.show.bot();

    if (await this.elements.errors.visible()) {
      const errorMessage = await this.elements.errors.innerText();
      this.log('errorMessage:', errorMessage);
      throw new ey.Error(500, `login-error-${Buffer.from(errorMessage).toString('hex')}`);
    }

    await this.elements.email.fill(this.context('username'));
    await this.elements.nextBtn.click();
    await bot.page.waitFor(10000);

    await this.elements.password.fill(this.context('password'));
    await this.elements.loginBtn.click();
  }
}

module.exports = PayPalLoginMainScene;
