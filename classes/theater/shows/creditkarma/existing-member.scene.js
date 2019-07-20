const PromiseCondition = require('../../promise-condition');const CreditKarmaJustClickAwareScene = require('./just-click-aware-scene');

class CreditKarmaExistingMemberScene extends CreditKarmaJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        creditSignupFail: {
          selector: '#credit-signup-fail-section',
          match: e => /looks like you might already be a registered member of Credit Karma/.test(e.innerText),
        },
        originalEmail: {
          selector: '.originalEmail',
          visibility: 'optional',
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    const email = await this.elements.originalEmail.innerText();
    this.log('Existing Account Email: ', email);

    this.show.emit('creditAccountBotResult', {
      status: 'ExistingUser',
      email,
    });
    throw new Error((500, 'ExistingAccount');
  }
}

module.exports = CreditKarmaExistingMemberScene;
