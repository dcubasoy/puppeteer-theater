const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneCreditWiseHomeScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        creditImpactHeader: {
          selector: 'div.feature-heading',
          match: e => /What Impacts Your Credit/.test(e.innerText),
        },
        mainScoreRating: {
          selector: '#main-score-rating',
          visibility: 'optional',
        },
        creditScore: {
          selector: '#main-score',
          visibility: 'optional',
        },
        scoreSimulatorNav: {
          selector: '#summary-nav-simulator',
        },
        summaryNavReport: {
          selector: '#summary-nav-report',
        },
        summaryNavActivity: {
          selector: '#summary-nav-activity',
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

    const scoreRating = await this.elements.mainScoreRating.innerText();
    if (scoreRating) {
      this.log('Found credit score rating: ', scoreRating);
      this.setContext('scoreRating', scoreRating);
    }

    const creditScore = await this.elements.creditScore.innerText();
    if (creditScore) {
      this.log('Found credit score: ', creditScore);
      this.setContext('score', +creditScore);
    }

    await this.elements.summaryNavReport.click();
  }
}

module.exports = CapitalOneCreditWiseHomeScene;
