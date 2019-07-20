const Scene = require('../../scene');

class FacebookSpinnerAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: Object.assign({
        jfpwSpinner: {
          selector: '.jfpw-spinner',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        ebSpinnerLoading: {
          selector: '.eb-loading-spinner',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        loading: {
          selector: '.loading',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
      }, args.elementQueries || {}),
    }));
  }
}

module.exports = FacebookSpinnerAwareScene;
