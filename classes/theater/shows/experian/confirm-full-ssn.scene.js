const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../promise-condition');

class ExperianConfirmFullSSNScene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        confirmHeader: {
          selector: '.medium',
          match: e => /Please Confirm Your SSN/.test(e.innerText),
        },
        ssn: {
          selector: 'input[name="ssn"]',
        },
        ssnVerifyBtn: {
          selector: 'button[data-tms="registration-ssnVerify-submit"]',
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    const spec = this.context('spec');

    await this.elements.ssn.fill(spec.ssn);
    await this.elements.ssnVerifyBtn.click();
  }
}

module.exports = ExperianConfirmFullSSNScene;
