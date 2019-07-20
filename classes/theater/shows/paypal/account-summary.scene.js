const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');

class PayPalAccountSummaryScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        welcomeHeader: {
          selector: '.vx_isActive',
          match: e => /Summary/.test(e.innerText),
        },
        sendAndRequestNav: {
          selector: '#header-transfer',
        },
        activityNav: {
          selector: '#header-activity',
        },
        walletNav: {
          selector: '#header-wallet',
        },
        accountDetails: {
          selector: '.cw_tile-itemList',
          visibility: 'optional',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
        new Scene.Extensions.PreventCurtainFall({ playCount: 1 }),
      ],
      generic: false,
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    const bot = await this.show.bot();

    this.log('Linked');
    this.show.emit('retailerBotResult', { status: 'Linked' });

    const accountDetails = await this.elements.accountDetails.innerText();
    this.log('Found recent activity: ', accountDetails);
    bot.goto('https://www.paypal.com/myaccount/settings/').catch(() => {});
  }
}

module.exports = PayPalAccountSummaryScene;
