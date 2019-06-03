const PromiseCondition = require('../../promise-condition');
const CreditKarmaJustClickAwareScene = require('./just-click-aware-scene');

class CreditKarmaCreateAccountStep1Scene extends CreditKarmaJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        email: {
          selector: '#email',
        },
        password: {
          selector: '#password',
        },
        submitBtn: {
          selector: '#submitImage',
        },
      },
    }, args));
  }

  async play() {
    await super.play();

    await this.elements.email.fill(this.context('tempUsername'));
    await this.elements.password.fill(this.context('tempPassword'));
    await this.elements.submitBtn.click();
  }
}

module.exports = CreditKarmaCreateAccountStep1Scene;
