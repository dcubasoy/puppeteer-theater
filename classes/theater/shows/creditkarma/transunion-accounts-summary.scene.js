const Scene = require('../../scene');
const PromiseCondition = require('../../../../utils/promise-condition');
const CreditKarmaJustClickAwareScene = require('./just-click-aware-scene');

class CreditKarmaTransunionAccountsSummaryScene extends CreditKarmaJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        header: {
          selector: 'h2',
          match: e => /Accounts Reported by TransUnion/.test(e.textContent),
        },
        equifaxToggle: {
          selector: '.toggler > a',
          visibility: 'optional',
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    const bot = await this.show.bot();

    await this.elements.equifaxToggle.click();
    await bot.page.waitFor(5000);

    bot.goto('https://www.creditkarma.com/credit-health/transunion/factors').catch(() => {});
  }
}

module.exports = CreditKarmaTransunionAccountsSummaryScene;
