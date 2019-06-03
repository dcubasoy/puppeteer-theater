const Scene = require('../../scene');

class CreditKarmaValidationFailedScene extends Scene {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        validationFailedHeader: {
          selector: '#register-section > header > h1',
          match: e => /Validation Failed/.test(e.innerText),
        },
      },
    }, args));
  }


  async play() {
    await super.play();
    this.show.emit('creditAccountBotResult', { status: 'NoHitFile' });
    throw new Error('NoHitFile');
  }
}

module.exports = CreditKarmaValidationFailedScene;
