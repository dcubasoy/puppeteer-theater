const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalAccountProfileAddEmailScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        addEmailHeader: {
          selector: '#overpanel-header > h2',
          match: e => /Add an email/.test(e.innerText),
        },
        newEmail: {
          selector: 'div.textInput.email.email.email.lap',
          visibility: 'optional',
        },
        addEmailBtn: {
          selector: '.addEmail',
          visibility: 'optional',
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match(), this.context('addEmail'));
  }

  async play() {
    await super.play();

    await this.elements.newEmail.fill(this.context('newEmail'));
    await this.elements.addEmailBtn.click();
  }
}

module.exports = PayPalAccountProfileAddEmailScene;
