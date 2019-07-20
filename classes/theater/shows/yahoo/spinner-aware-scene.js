const Scene = require('../../scene');

class YahooSpinnerAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: Object.assign({
        yahooLoadingSpinner: {
          selector: '.yahoo-loading',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        recaptchaSpinner: {
          selector: '#recaptcha-spinner',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
      }, args.elementQueries || {}),
    }));
  }
}

module.exports = YahooSpinnerAwareScene;
