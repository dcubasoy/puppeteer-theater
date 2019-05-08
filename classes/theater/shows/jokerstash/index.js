const path = require('path');
const Show = require('../../show');

class JokerShow extends Show {
  constructor(args) {
    super(Object.assign({
    }, args));

    this.internalBot.page.on('dialog', async (dialog) => {
      this.logger.info(`Intercepted dialog: ${dialog.message()}`);
      await dialog.dismiss();
    });
  }
}
JokerShow.Scenes = Show.scenes(path.join(__dirname, './'));
JokerShow.SceneSets = (() => {
  const Default = [
    JokerShow.Scenes.JokerJustClickScene,
    JokerShow.Scenes.JokerLoginScene,
    JokerShow.Scenes.JokerStashNewsScene,
    JokerShow.Scenes.JokerStashCalmDownScene,
  ];

  const Extract = [
    ...Default,
    JokerShow.Scenes.JokerStashSSNSearchScene,
    JokerShow.Scenes.JokerStashCardsScene,
    JokerShow.Scenes.JokerStashDumpsScene,
    JokerShow.Scenes.JokerStashCheckoutCartScene,
    JokerShow.Scenes.JokerStashSSNSearchResultsScene,
    JokerShow.Scenes.JokerStashOrdersScene,
  ];

  const Order = [
    ...Default,
    JokerShow.Scenes.JokerStashAddFundsScene,
    JokerShow.Scenes.JokerStashCardsScene,
    JokerShow.Scenes.JokerStashDumpsScene,
    JokerShow.Scenes.JokerStashCheckoutCartScene,
  ];

  const Register = [
    ...Default,
    JokerShow.Scenes.JokerStashRegistrationScene,
  ];

  return { Extract, Default, Order, Register };
})();

module.exports = JokerShow;
