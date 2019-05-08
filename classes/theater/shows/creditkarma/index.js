const path = require('path');
const { URL } = require('url');
const Show = require('../../show');

class CreditKarmaShow extends Show {
  constructor(args) {
    super(Object.assign({
    }, args));

    this.internalBot.page.on('framenavigated', async (frame) => {
      const oURL = new URL(frame.url());
      const url = oURL.toString();

      if (/dashboard/i.test(url)) {
        this.setContext('dashboard', true);
      }

      if (/factors/i.test(url)) {
        this.setContext('factors', true);
      }

      if (/changes/i.test(url)) {
        this.setContext('creditChanges', true);
      }

      if (/inactive/i.test(url)) {
        this.setContext('inactive', true);
      }
    });

    this.internalBot.page.on('response', async (response) => {
      const url = response.url();
      const oURL = new URL(url);

      if (oURL.pathname === '/mobile/4.5/frontier-graphql') {
        try {
          const creditScores = await response.json();

          const parsedScore = creditScores[0].data.creditScores.transunion[0].value;
          this.logger.info(`Intercepted Score: ${parsedScore}`);
          // this.setContext('score', +parsedScore);

        // eslint-disable-next-line no-empty
        } catch (error) { }
      }
    });
  }
}

CreditKarmaShow.Scenes = Show.scenes(path.join(__dirname, './'));
CreditKarmaShow.SceneSets = (() => {

  const Default = [
    CreditKarmaShow.Scenes.CreditKarmaJustClickScene,
    CreditKarmaShow.Scenes.CreditKarmaInactiveLogoutScene,
    CreditKarmaShow.Scenes.CreditKarmaRenewCookieScene,
  ];

  const SignUp = [
    ...Default,
    CreditKarmaShow.Scenes.CreditKarmaCreateAccountStep1Scene,
    CreditKarmaShow.Scenes.CreditKarmaCreateAccountStep2Scene,
    CreditKarmaShow.Scenes.CreditKarmaIdentityVerificationScene,
    CreditKarmaShow.Scenes.CreditKarmaValidationFailedScene,
    CreditKarmaShow.Scenes.CreditKarmaExistingMemberScene,
    CreditKarmaShow.Scenes.CreditKarmaDashboardScene,
  ];

  const ExtractReport = [
    ...Default,
    CreditKarmaShow.Scenes.CreditKarmaLoginScene,
    CreditKarmaShow.Scenes.CreditKarmaWelcomeBackScene,
    CreditKarmaShow.Scenes.CreditKarmaTransunionAccountsSummaryScene,
    CreditKarmaShow.Scenes.CreditKarmaPrintMyReportScene,
  ];

  return { SignUp, ExtractReport };
})();


module.exports = CreditKarmaShow;
