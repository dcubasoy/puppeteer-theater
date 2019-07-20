const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneCreditWiseOpenAccountsScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        creditImpactHeader: {
          selector: 'div.fcr-summary-view > accounts-list-component:nth-of-type(1) > div.fcr-view-wrapper > div.credit-report-list-header > h2',
          match: e => /Open Accounts/.test(e.innerText),
        },
        accountsAndBalancesDetails: {
          selector: '#credit-report-details-ui-view > accounts-and-balances-details-component > div',
          visibility: 'optional',
        },

      },
      extensions: [
        new Scene.Extensions.Delay(12000),
      ],
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();

    const accountsAndBalancesDetails = await this.elements.accountsAndBalancesDetails.innerText();
    if (accountsAndBalancesDetails) {
      this.log('Found open accounts: ', accountsAndBalancesDetails);
      this.setContext('creditAccounts', accountsAndBalancesDetails);
    }

    const creditScore = await this.elements.creditScore.innerText();
    if (creditScore) {
      this.log('Found credit score: ', creditScore);
      this.setContext('score', +creditScore);
    }

    await this.elements.summaryNavReport.click();
  }
}

module.exports = CapitalOneCreditWiseOpenAccountsScene;
