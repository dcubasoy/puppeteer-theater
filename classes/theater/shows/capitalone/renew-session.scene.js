const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class CapitalOneRenewSessionScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        signedOutHeader: {
          selector: 'h2',
          match: e => /You've successfully signed out/.test(e.innerText),
        },
        signOnBtn: {
          selector: '.component-cta > a',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
      ],
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    this.log('Renewing session');
    await this.elements.signOnBtn.click();
  }
}

module.exports = CapitalOneRenewSessionScene;
