const Scene = require('../../scene');

const Selectors = {
  remindMeLaterBtn: 'button[name="remind_me_later"]',
  sessionExtendBtn: '#fsdTimeoutModal > div > div > div.fsd_timeoutModal-content > div:nth-of-type(2) > div.Ok-button-container > a.fsd-gray',
  stillThereBtn: 'div.navigate-away-button.btn.btn-primary',
  closeModalBtn: 'button.close.timeout-close-button',
  closeTimeoutModalBtn: '#closeModalWindow_timeoutModal',
  dismissModalBtn: '#dismiss-modal-button',
  goToHomePageLink: '#capitalOneTimeoutLink',
  imStillHereBtn: 'button[data-ng-click="timeout.close()"]',
};

class CapitalOneJustClickScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: Object.keys(Selectors)
        .map(k => [k, { selector: Selectors[k], visibility: 'required:groupA' }])
        .concat(Object.keys(args.elementQueries || {})
          .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
      extensions: [new Scene.Extensions.Click({ once: true })],
    }));
  }
}
CapitalOneJustClickScene.Selectors = Selectors;

module.exports = CapitalOneJustClickScene;
