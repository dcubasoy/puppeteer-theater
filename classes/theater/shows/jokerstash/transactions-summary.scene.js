const Scene = require('../../scene');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class JokerStashTransactionSummaryScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        transactionsHeader: {
          selector: 'h1',
          match: e => /Transactions/.test(e.innerText),
        },
        transactionsTable: {
          selector: '.transactions',
        },
      },
    }, args));
  }


  async play() {
    await super.play

    const transactions = await this.elements.transactionsTable.tableContent();
    this.log('Found transactions: ', transactions);


  }
}

module.exports = JokerStashTransactionSummaryScene;
