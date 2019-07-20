/* eslint-disable no-empty */
const path = require('path');
const Show = require('../../show');

class FacebookShow extends Show {
  constructor(args) {
    super(Object.assign({
    }, args));
  }
}

FacebookShow.Scenes = Show.scenes(path.join(__dirname, './'));
FacebookShow.SceneSets = (() => {

  const Default = [
    FacebookShow.Scenes.FacebookJustClickScene,
  ];

  const SignIn = [
    ...Default,
    FacebookShow.Scenes.FacebookLoginMainScene,
    FacebookShow.Scenes.FacebookDashboardHomeScene,
    FacebookShow.Scenes.FacebookPaymentHistoryScene,
    FacebookShow.Scenes.FacebookIncorrectPasswordScene,
  ];

  const SignUp = [
    ...Default,
    FacebookShow.Scenes.FacebookCreateNewAccountScene,
    FacebookShow.Scenes.FacebookEmailVerificationConfirmationScene,
    FacebookShow.Scenes.FacebookWelcomeAccountCreatedScene,
  ];
  return { SignUp, SignIn };
})();

module.exports = FacebookShow;
