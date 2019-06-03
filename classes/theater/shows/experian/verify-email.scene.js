const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

class ExperianVerifyYourEmailScene extends Scene {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        validationMessage: {
          selector: '.registration-process .field-validation-error',
          match: e => /We could not verify the email address you provided/.test(e.textContent),
        },
        submitBtn: {
          selector: '#tt-id-reg-btn-op1-8',
        },
      },
      extensions: [
        new Scene.Extensions.Click('submitBtn'),
      ],
    }, args));
  }

  async play() {
    await super.play();
  }
}

module.exports = ExperianVerifyYourEmailScene;
