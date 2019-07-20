const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalSignupConfirmationScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        confirmationHeader: {
            selector: 'h1',
            match: e => /You are in/.test(e.innerText),
        },
      },
      extensions: [
        new Scene.Extensions.PreventCurtainFall({playCount: 1}),
      ],
      generic: false,
    }, args));
  }

  async play() {
    await super.play();
    const bot = await this.show.bot();

    this.log('Found signup confirmation...');
    this.show.emit('profileAccountResult', {
      status: 'Linked',
      spec: this.context('spec'),
    });


    bot.goto('https://www.paypal.com/').catch(() => {});
  }
}

module.exports = PayPalSignupConfirmationScene;
