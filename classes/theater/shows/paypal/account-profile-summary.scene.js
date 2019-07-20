const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalAccountProfileSummaryScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        accountTab: {
          selector: '#accountTab',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(),
        new Scene.Extensions.PreventCurtainFall({ playCount: 1 }),
      ],
      generic: false,
    }, args));
  }

  async play() {
    await super.play();

    const accountInformation = await this.elements.accountTab.innerText();
    this.log('Found account data: ', accountInformation);
    this.show.emit('retailerBotResult', {
      status: 'Linked',
      accountInformation,
    });
  }
}

module.exports = PayPalAccountProfileSummaryScene;
