const ey = require('@nicomee/bt_backend-core');
const Scene = require('../../scene');
const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class ExperianFinancialProfileScene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        headline: {
          selector: '#tt-id-efp-header-main-headline',
          match: e => /Financial Profile/.test(e.textContent),
        },
        reportsAndScores: {
          selector: '#navReportsScores',
        },
        profileDetails: {
          selector: '#tt-id-efp-exp-financial-profile-desc-container',
        },
      },
    }, args));
  }

  async play() {
    await super.play();

    const profileDetails = await this.elements.profileDetails.innerText();
    this.log('Extracted financial profile details: ', profileDetails);

    // re-release bot
    const bot = await this.show.bot();
    bot.goto('https://usa.experian.com/#/credit/reports/experian/now/accounts/groups').catch(() => {});
  }
}

module.exports = ExperianFinancialProfileScene;
