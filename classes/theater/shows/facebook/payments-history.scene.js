const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const FacebokJustClickAwareScene = require('./just-click-aware-scene');

class FacebookPaymentHistoryScene extends FacebokJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        paymentSettings: {
          selector: '#contentArea',
          match: e => /Payment/ig.test(e.innerText),
        },
        accountSettings: {
          selector: '#userNavigationLabel',
          match: e => /Account Settings/ig.test(e.innerText),
        },
      },
      extensions: [
        new Scene.Extensions.PreventCurtainFall({playCount: 1 }),
        new Scene.Extensions.Delay(),
      ],
      generic: false,
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();

    const details = await this.elements.paymentSettings.innerText();
    this.log('Payments Details: ', details);
    this.show.emit('retailerDocumentBotResult', {
      status: 'Linked',
      paymentDetails: details,
    });

    await this.elements.accountSettings.click();
  }
}

module.exports = FacebookPaymentHistoryScene;
