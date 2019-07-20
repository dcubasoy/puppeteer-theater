const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneAnyoneThereJustClickScene extends CapitalOneJustClickAwareScene.WithoutSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        waitImStillHereBtn: {
          selector: 'button.progressive',
          match: e => /Wait, I'm still here/.test(e.innerText),
        },
      },
      extensions: [
        new Scene.Extensions.Delay(Math.random() * Math.floor(9000)),
        new Scene.Extensions.Click('waitImStillHereBtn'),
      ],
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
  }
}

module.exports = CapitalOneAnyoneThereJustClickScene;
