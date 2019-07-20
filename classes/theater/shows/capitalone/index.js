const path = require('path');
const Show = require('../../show');


class CapitalOneShow extends Show {
  constructor(args = {}) {
    super(Object.assign({
    }, args));
  }
}

CapitalOneShow.Scenes = Show.scenes(path.join(__dirname, './'));
CapitalOneShow.SceneSets = (() => {
  const Default = [
    CapitalOneShow.Scenes.CapitalOneJustClickScene,
    CapitalOneShow.Scenes.CapitalOneRenewSessionScene,
  ];

  const SignIn = [
    ...Default,
    CapitalOneShow.Scenes.CapitalOneLoginMainScene,
    CapitalOneShow.Scenes.CapitalOneCreditCardsHomeScene,
    CapitalOneShow.Scenes.CapitalOneAccountsSummaryScene,
    CapitalOneShow.Scenes.CapitalOneProfileAlertsScene,
    CapitalOneShow.Scenes.CapitalOneProfileSummaryScene,
    CapitalOneShow.Scenes.CapitalOneLoginMFAPromptScene,
    CapitalOneShow.Scenes.CapitalOneAnyoneThereJustClickScene,
    CapitalOneShow.Scenes.CapitalOneSomethingWentWrongScene,
    CapitalOneShow.Scenes.CapitalOneAccountUsersScene,
    CapitalOneShow.Scenes.CapitalOneAddAuthorizedUserModalScene,
    CapitalOneShow.Scenes.CapitalOneAccountSummaryDetailScene,
  ];

  const CreditWiseSignup = [
    ...Default,
    CapitalOneShow.Scenes.CapitalOneCreditWiseEnrollScene,
  ];

  const ExtractCreditReport = [
    ...Default,
    CapitalOneShow.Scenes.CapitalOneCreditWiseOpenAccountsScene,
    CapitalOneShow.Scenes.CapitalOneCreditWiseHomeScene,
    CapitalOneShow.Scenes.CapitalOneCreditWiseCreditReportScene,
  ];

  const PlatninumMastercardApply = [
    ...Default,
    CapitalOneShow.Scenes.CapitalOneApplyNowCardScene,
  ];

  return { SignIn, ExtractCreditReport, PlatninumMastercardApply, CreditWiseSignup };
})();

module.exports = CapitalOneShow;
