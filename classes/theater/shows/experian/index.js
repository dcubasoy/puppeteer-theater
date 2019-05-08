/* eslint-disable no-empty */
const path = require('path');
const { URL } = require('url');
const Show = require('../../show');

class ExperianShow extends Show {
  constructor(args) {
    super(Object.assign({
    }, args));

    this.internalBot.page.on('framenavigated', async (frame) => {
      const oURL = new URL(frame.url());
      const url = oURL.toString();


      if (/ato/.test(url)) {
        this.setContext('ato', true);
      }
    });

    this.internalBot.page.on('response', async (response) => {
      const url = response.url();
      const oURL = new URL(url);

      if (url.endsWith('EX') || url.includes('forcereload') || url.includes('reports')) {
        try {
          const latestReport = await response.json();
          this.setContext('latestReport', latestReport);

          const parsedScore = latestReport.reportInfo.creditFileInfo[0].score.score_txt;
          this.logger.verbose(`Intercepted score: ${parsedScore}`);
          if (parsedScore) this.setContext('score', +parsedScore);
        } catch (error) { }
      }
    });
  }
}

ExperianShow.Scenes = Show.scenes(path.join(__dirname, './'));
ExperianShow.SceneSets = (() => {
  const Default = [
    ExperianShow.Scenes.ExperianJustClickScene,
  ];

  const SignUp = [
    ...Default,
    ExperianShow.Scenes.ExperianExistingAccountScene,
    ExperianShow.Scenes.ExperianUnableToProcessScene,
    ExperianShow.Scenes.ExperianNoHitCreditFileScene,
    ExperianShow.Scenes.ExperianCreateAccountStep1Scene,
    ExperianShow.Scenes.ExperianCreateAccountStep2Scene,
    ExperianShow.Scenes.ExperianCreateAccountStep3Scene,
    ExperianShow.Scenes.ExperianIdentityVerificationScene,
    ExperianShow.Scenes.ExperianConfirmFullSSNScene,
    ExperianShow.Scenes.ExperianVerifyYourEmailScene,
    ExperianShow.Scenes.ExperianDashboardScene,
  ];


  const ExtractReport = [
    ...Default,
    ExperianShow.Scenes.ExperianUpdatePaymentMethodScene,
    ExperianShow.Scenes.ExperianUpgradeAccountMembershipScene,
    ExperianShow.Scenes.ExperianUpgradeYourAccountScene,
    ExperianShow.Scenes.ExperianAccountATOPromptPage,
    ExperianShow.Scenes.ExperianLoginMainScene,
    ExperianShow.Scenes.ExperianFinancialProfileScene,
    ExperianShow.Scenes.ExperianCreditSummaryAccountsScene,
  ];

  return { SignUp, ExtractReport };
})();


module.exports = ExperianShow;
