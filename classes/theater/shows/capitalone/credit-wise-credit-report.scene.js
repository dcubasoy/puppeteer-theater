const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneCreditWiseCreditReportScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        creditReportHeader: {
          selector: 'h2.fcr-beta > span',
          match: e => /Credit Report/.test(e.innerText),
        },
        accountsAndBalances: {
          selector: 'accounts-balances-component > div:nth-of-type(1) > div.summary-section-header > a',
          match: e => /Accounts/.test(e.innerText),
        },
      },
      extensions: [
        new Scene.Extensions.Click('accountsAndBalances'),
      ],
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    return super.play();
  }
}

module.exports = CapitalOneCreditWiseCreditReportScene;
