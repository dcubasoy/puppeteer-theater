const Scene = require('../../scene');

class PayPalSpinnerAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: Object.assign({
        appChallenge: {
          selector: '.appChallengeNS',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        genericSpinner: {
          selector: '.spinner',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        captchaChallenge: {
          selector: '#captcha-standalone',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        vxSpinner: {
          selector: '.vx_spinner-small,.vx_spinner',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        vxHasSpinner: {
          selector: '.vx_has-spinner',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        addBankSpinners: {
          selector: '.confirm3ds-spinner',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        bankNameSpinners: {
          selector: '.bankNameSpinner',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        busySpinner: {
          selector: '.busyIcon',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
      }, args.elementQueries || {}),
    }));
  }
}

module.exports = PayPalSpinnerAwareScene;
