const path = require('path');
const Show = require('../../show');

class YahooShow extends Show {
  constructor(args) {
    super(Object.assign({
    }, args));

    this.internalBot.page.on('dialog', async (dialog) => {
      this.logger.info(`Intercepted dialog: ${dialog.message()}`);
      await dialog.dismiss();
    });

  }
}

YahooShow.Scenes = Show.scenes(path.join(__dirname, './'));
YahooShow.SceneSets = (() => ({
  Default: [
    YahooShow.Scenes.YahooLoginMainScene,
    YahooShow.Scenes.YahooLoginHomeMainScene,
    YahooShow.Scenes.YahooLoginMFAScene,
    YahooShow.Scenes.YahooMailInboxScene,
    YahooShow.Scenes.YahooSignupMainScene,
    YahooShow.Scenes.YahooRenewSessionScene,
    YahooShow.Scenes.YahooLoginCaptchaAuthScene,
    YahooShow.Scenes.YahooLoginPostAuthScene,
    YahooShow.Scenes.YahooUnusualAccountActivityScene,
    YahooShow.Scenes.YahooRenewCookieScene,
  ],
}))();

module.exports = YahooShow;
