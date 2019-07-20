const Scene = require('../../scene');

class CapitalOneSpinnerAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: Object.assign({
        loadingSpinner: {
          selector: '.loading',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        loadingIcon: {
          selector: '.loadingIcon',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        loadingImage: {
          selector: '.loading-image',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        waitingDiv: {
          selector: '#waitingDiv',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        establishSpinner: {
          selector: '.establish-steps-spinner',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        genericSpinner: {
          selector: '.spinner,.widget-spinner-container',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
      }, args.elementQueries || {}),
    }));
  }
}

module.exports = CapitalOneSpinnerAwareScene;
