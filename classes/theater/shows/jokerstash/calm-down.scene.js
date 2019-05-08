const Scene = require('../../scene');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class JokerStashCalmDownScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        cardsHeader: {
          selector: 'h1',
          match: e => /Calm Down/.test(e.innerText),
        },
      },
      extensions: [
        new Scene.Extensions.Delay(15000),
      ],
    }, args));
  }

  async play() {
    await super.play();

    // re-release bot
    const bot = await this.show.bot();
    await bot.page.goBack({ waitUntil: 'networkidle0' });
  }
}

module.exports = JokerStashCalmDownScene;
