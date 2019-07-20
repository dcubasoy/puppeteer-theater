const path = require('path');
const { URL } = require('url');
const Show = require('../../show');


class AmexShow extends Show {
  constructor(args = {}) {
    super(args);
    this.internalBot.page.on('framenavigated', async (frame) => {
      const oURL = new URL(frame.url());
      const url = oURL.toString();
    });
  }
}

AmexShow.Scenes = Show.scenes(path.join(__dirname, './'));


AmexShow.SceneSets = (() => {
  const Default = [
    AmexShow.Scenes.AmexJustClickScene,
    AmexShow.Scenes.AmexAccessDeniedScene,
    AmexShow.Scenes.AmexMobileAppCTAScene,
  ];

  const SignIn = [
    ...Default,
    AmexShow.Scenes.AmexLoginMainScene,
    AmexShow.Scenes.AmexAccountHomeScene,
    AmexShow.Scenes.AmexFillLastFourSSNSceneMFA,
    AmexShow.Scenes.AmexAccessDeniedScene,
    AmexShow.Scenes.AmexMobileAppCTAScene,
  ];

  const ReferallApply = [
    ...Default,
    AmexShow.Scenes.AmexApplicationDeniedHardScene,
    AmexShow.Scenes.AmexTemporarilyUnavailableScene,
  ];


  return { Default, SignIn, ReferallApply };
})();

module.exports = AmexShow;
