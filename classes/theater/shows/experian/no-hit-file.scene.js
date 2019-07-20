const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../promise-condition');

class ExperianNoHitCreditFileScene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        eCredableBody: {
          selector: 'div.e-credable-body',
          visibility: 'optional',
        },
        header: {
          selector: '.title.main',
          match: e => /We can't seem to find your Experian Credit Report and FICO/.test(e.textContent),
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    this.setContext('score', 0);
    this.show.emit('creditAccountBotResult', {
      status: 'NoHitFile',
    });
    throw new Error('NoHitFile');
  }
}

module.exports = ExperianNoHitCreditFileScene;
