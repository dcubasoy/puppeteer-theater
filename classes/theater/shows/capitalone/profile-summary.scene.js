const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneProfileSummaryScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        profileSummaryHeader: {
          selector: 'h1',
          match: e => /Profile/.test(e.innerText),
        },
        backBtn: {
          selector: '#backButtonId',
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

    this.setContinousPlayLimit('profileSummaryHeader', 10);
    await this.elements.backBtn.click();
  }
}

module.exports = CapitalOneProfileSummaryScene;
