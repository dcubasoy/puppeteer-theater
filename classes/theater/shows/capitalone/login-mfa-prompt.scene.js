
const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneLoginMFAPromptScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        multiFactorAuthHeader: {
          selector: '.ci-page-header',
          match: e => /We noticed something different about this sign in/.test(e.innerText),
        },
        sendSMSCodeBtn: {
          selector: '#choice-multi-0-span-0',
          visibility: 'optional',
        },
        callWithCodeBtn: {
          selector: '#choice-multi-1-span-0',
          visibility: 'optional',
        },
        sendPromptToPhoneBtn: {
          selector: '#choice-swift-p-0',
          visibility: 'optional',
        },
        noAccessOptOutBtn: {
          selector: '#choice-a-1',
          visibility: 'optional',
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    this.setContinousPlayLimit('multiFactorAuthHeader', 1);
    this.show.emit('retailerBotResult', { status: 'LoginMFA' });

    // todo: handle MFA
    throw new Error((500, 'MFA');
  }
}

module.exports = CapitalOneLoginMFAPromptScene;
