const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneProfileAlertsScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        profileAlertsHeader: {
          selector: 'h1',
          match: e => /Alerts/.test(e.innerText),
        },
        backBtn: {
          selector: '#backButtonId',
        },
      },
      extensions: [
        new Scene.Extensions.Click('backBtn'),
      ],
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    this.setContinousPlayLimit('profileAlertsHeader', 10);
  }
}

module.exports = CapitalOneProfileAlertsScene;
