
const Scene = require('../../scene');
const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');

class ExperianCreditSummaryAccountsScene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        accountsActiveNav: {
          selector: 'li.active',
          match: e => /Accounts/.test(e.textContent) || /Summary/.test(e.textContent),
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
        new Scene.Extensions.PreventCurtainFall({ playCount: 1 }),
      ],
      generic: false,
    }, args));
  }

  async play() {
    await super.play();
    const bot = await this.show.bot();

    await bot.page.evaluate(() => {
      document.querySelector('button.ecs-btn.rounded-corners.visible-lg.option-dropdown').click();
      document.querySelector('div.btn-group.report-btn-container.open > ul.dropdown-menu.dropdown-menu-right > li:first-child > a').click();
    });

    await bot.page.waitFor(8000);
    const pages = await bot.browser.pages();

    const reportPage = pages[2];
    await reportPage.bringToFront();
    const pdf = await reportPage.pdf({
      printBackground: true,
      format: 'Letter',
      displayHeaderFooter: true,
    });

    this.show.emit('creditDocumentBotResult', {
      status: 'OK',
      lastExtractionDate: new Date(),
      source: 'Experian',
      report: pdf,
    });
    this.setContext('reportExtracted', true);
  }
}
module.exports = ExperianCreditSummaryAccountsScene;
