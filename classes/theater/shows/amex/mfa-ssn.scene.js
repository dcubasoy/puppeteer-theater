const PromiseCondition = require('../../promise-condition');const AmexJustClickAwareScene = require('./just-click-aware-scene');

class AmexFillLastFourSSNSceneMFA extends AmexJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: '.alert',
          visibility: 'optional',
          visibilityAreaCheck: true,
        },
        securityHeader: {
          selector: 'h2',
          match: e => /For Your Account Security/.test(e.innerText),
        },
        lastFour: {
          selector: '#onl-social',
          visibility: 'optional',
        },
        continueBtn: {
          selector: 'button',
          match: e => /Continue/.test(e.innerText),
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(
      super.match(),
    );
  }

  async play() {
    await super.play();
    this.setContinousPlayLimit('errors', 100);
    const spec = this.context('spec');

    const { ssn } = spec;

    await this.elements.lastFour.fill(ssn.split('-')[0]);
    await this.elements.continueBtn.click();
  }
}

module.exports = AmexFillLastFourSSNSceneMFA;
