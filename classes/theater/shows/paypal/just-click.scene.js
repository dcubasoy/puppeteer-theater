const Scene = require('../../scene');

const Selectors = {
  closeModalBtn: 'button[data-dismiss="modal"]',
  proceedBtn: '#proceed',
  extendSessionBtn: '#extendSession-btn',
  myAccountBtn: '#myaccount-button',
  justLogInBtn: 'a.vx\\_globalNav-link_logout.nemo\\_loginBtn',
  justClickOkayBtn: 'a.vx_btn.gotoStart',
  justDonateBtn: '#payWithGuest',
};

class PayPalJustClickScene extends Scene {
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
PayPalJustClickScene.Selectors = Selectors;

module.exports = PayPalJustClickScene;
