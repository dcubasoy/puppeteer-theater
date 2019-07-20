const PromiseCondition = require('../../promise-condition');const CreditKarmaSpinnerAwareScene = require('./spinner-aware-scene');

class CreditKarmaDashboardScene extends CreditKarmaSpinnerAwareScene {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        dashboardScores: {
          selector: '.dashboard-scores',
        },
        overviewDropdown: {
          selector: 'div.navi-bar_left.icons > div:nth-child(3)',
          visibility: 'optional',
        },
        scoreDetails: {
          selector: 'div.navi-bar_left.icons > div:nth-of-type(2) > div.navi-bar_dropdown > a:nth-of-type(2)',
          visibility: 'optional',
        },
        accountsNav: {
          selector: 'body > div > div > nav > div.navi-bar > div.navi-bar_left.icons > div:nth-child(5) > a',
          visibility: 'optional',
        },
      },
      generic: false,
    }, args));
  }

  async accessToken() {
    const bot = await this.show.bot();
    return bot.page.evaluate(() => {
      // eslint-disable-next-line no-undef
      const { _ACCESS_TOKEN } = window;
      return _ACCESS_TOKEN;
    });
  }

  async curtainFallen() {
    return PromiseCondition.and(super.curtainFallen(), this.context('signedIn'));
  }

  async play() {
    await super.play();

    this.log('Linked');
    this.show.emit('creditAccountBotResult', {
      status: 'Linked',
      meta: {
        creditKarmaUsername: this.context('username'),
        creditKarmaPassword: this.context('password'),
      }
    });

    if (this.context('harvestEnabled')) {
      // release bot
      const bot = await this.show.bot();
      bot.goto('https://www.creditkarma.com/myfinances/creditreport/transunion/view/print#overview').catch(() => {});
    }
    this.setContext('signedIn', true);
  }
}

module.exports = CreditKarmaDashboardScene;
