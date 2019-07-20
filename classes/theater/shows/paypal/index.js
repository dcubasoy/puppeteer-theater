/* eslint-disable no-empty */
const path = require('path');
const { URL } = require('url');
const Show = require('../../show');

class PayPalShow extends Show {
  constructor(args) {
    super(Object.assign({
    }, args));

    this.internalBot.page.on('dialog', async (dialog) => {
      this.logger.info(`Intercepted dialog: ${dialog.message()}`);
      await dialog.dismiss();
    });
  }
}

PayPalShow.Scenes = Show.scenes(path.join(__dirname, './'));
PayPalShow.SceneSets = (() => {
  const Default = [
    PayPalShow.Scenes.PayPalJustClickScene,
    PayPalShow.Scenes.PayPalSecurityChallengeScene,
    PayPalShow.Scenes.PayPalSecurityChallengeGenericScene,
    PayPalShow.Scenes.PayPalSomethingWentWrongScene,
    PayPalShow.Scenes.PaypPalLoginCaptchaAuthScene,
  ];

  const SignIn = [
    ...Default,
    PayPalShow.Scenes.PayPalLoginMainScene,
    PayPalShow.Scenes.PayPalAccountSummaryScene,
    PayPalShow.Scenes.PaypalAddBankScene,
    PayPalShow.Scenes.PaypalAddCardScene,
    PayPalShow.Scenes.PayPalAccountWalletScene,
    PayPalShow.Scenes.PayPalAccountProfileSummaryScene,
    PayPalShow.Scenes.PayPalAccountProfileAddEmailScene,
    PayPalShow.Scenes.PayPalWalletMoneyScene,
  ];

  const SignUp = [
    ...Default,
    PayPalShow.Scenes.PayPalAccountSelectionScene,
    PayPalShow.Scenes.PaypalIntentSelectionScene,
    PayPalShow.Scenes.PayPalSignupStep1Scene,
    PayPalShow.Scenes.PayPalSignupStep2Scene,
    PayPalShow.Scenes.PayPalSignupConfirmationScene,
  ];

  return { SignIn, SignUp };
})();

module.exports = PayPalShow;
