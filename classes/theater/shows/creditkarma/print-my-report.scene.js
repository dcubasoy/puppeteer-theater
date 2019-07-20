const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CreditKarmaJustClickAwareScene = require('./just-click-aware-scene');

class CreditKarmaPrintMyReportScene extends CreditKarmaJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        reportHeader: {
          selector: '#reportOverview > div.reportInfo > h1',
          match: e => /Credit Report/.test(e.innerText),
        },
        printView: {
          selector: '#print-view',
        },
        reportInfo: {
          selector: '.reportInfo',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
      ],
      generic: false,
    }, args));
  }


  async curtainFallen() {
    return PromiseCondition.and(super.curtainFallen(), this.context('reportExtracted'));
  }

  // eslint-disable-next-line class-methods-use-this
  getNum(val) {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(val)) {
      return 0;
    }
    return val;
  }

  async play() {
    await super.play();

    // re-release bot
    const bot = await this.show.bot();
    const parsedScore = await bot.page.evaluate(() => {
      const sc = (((document.querySelector('svg > text:nth-of-type(3)')) || {}).textContent || '');
      if (sc) return +sc;
      return 0;
    });

    this.setContext('score', this.getNum(parsedScore));

    this.log('Harvesting latest report...');

    const pdf = await bot.page.pdf({
      printBackground: true,
      format: 'Letter',
      displayHeaderFooter: true,
      preferCSSPageSize: true,
    });

    this.show.emit('creditDocumentBotResult', {
      source: 'CreditKarma',
      report: pdf,
      score: parsedScore,
    });
    this.setContext('reportExtracted', true);
  }
}

module.exports = CreditKarmaPrintMyReportScene;
