const Scene = require('../../scene');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class JokerStashSSNSearchResultsScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        resultsHeader: {
          selector: 'h1',
          match: e => /Results/.test(e.innerText),
        },
        resultSummary: {
            selector: '#body > p:nth-child(3),'
        },
        resultTable: {
          selector: '.ssres-table',
        },
      },
      generic: false,
      extensions: [
        new Scene.Extensions.Delay(5000),
        new Scene.Extensions.PreventCurtainFall({playCount: 1}),
      ]
    }, args));
  }


  async match() {
    return PromiseCondition.and(
      super.match(),
      this.context('ssnHarvesterEnabled'),
    );
  }


  async play() {
    await super.play();

    const summary = await this.elements.resultSummary.innerText();
    this.log('Found search results summary: ', summary);

    const results = await this.elements.resultTable.innerTexts();
    this.log('Found search results: ', results);

    this.show.emit('botDataResult', {
        id: `${Date.now()}-${`${currentPage}`}_cards`,
        data: results,
        meta: summary,
        type: 'ssn',
    });
  }
}

module.exports = JokerStashSSNSearchResultsScene;
