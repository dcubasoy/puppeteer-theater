const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalWalletMoneyScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        header: {
          selector: 'h1',
          match: e => /Money/.test(e.innerText),
        },
        transferLinkBtn: {
          selector: '#transfer-link',
          match: e => /Add money/.test(e.innerText),
        },
        sendRequestBtn: {
          selector: '#sendOrRequestMoneyLink',
        },
        banksAndCards: {
            selector: '.fi-module .section .card-info, .card-module .section .card-info, .fi-module .section .bank-info, .card-module .section .bank-info',
        }
      },
      extensions: [
        new Scene.Extensions.PreventCurtainFall({playCount: 1}),
      ],
      generic: false,
    }, args));
  }

  async play() {
    await super.play();

    const instruments = await this.elements.banksAndCards.innerTexts();
    this.log('Found payment instruments: ', instruments);

    if (this.context('operationMode') === 'send') {
        await this.elements.sendRequestBtn.click();
    }

  }
}

module.exports = PayPalWalletMoneyScene;
