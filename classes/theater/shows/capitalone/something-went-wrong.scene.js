
const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneSomethingWentWrongScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        multiFactorAuthHeader: {
          selector: '#snag-heading > h1',
          match: e => /something went wrong/.test(e.innerText),
        },
        okayBtn: {
          selector: 'button.oui-button.progressive',
          visibility: 'optional',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(7500),
      ],
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    this.log('Something went wrong...');
    await this.elements.okayBtn.click();
  }
}

module.exports = CapitalOneSomethingWentWrongScene;
