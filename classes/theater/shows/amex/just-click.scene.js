const Scene = require('../../scene');

const Selectors = {
  closeModalBtn: 'button.dls-icon-close.pull-xs-right.pad.btn-secondary.btn-icon.btn-inline.dls-black',
  closeBtn: 'button[title="Close"]',
  extendSessionBtn: 'btn.session_alignRight',
  expireExtendSessionBtn: 'button.continue',
  sessionBtnContinue: '#session_btn_continue',
  closeCTAMModalBtn: 'button[title="Close"]',
  returnToAmexHomeBtn: 'button[ng-if="err_vm.partner"]',
  justYesBtn: '#yesBtn',
};

class AmexJustClickScene extends Scene {
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
AmexJustClickScene.Selectors = Selectors;

module.exports = AmexJustClickScene;
