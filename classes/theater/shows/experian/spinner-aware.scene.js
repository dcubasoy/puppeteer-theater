const Scene = require('../../scene');

class ExperianSpinnerAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: Object.assign({
        spinnerAnimation: {
          selector: '.ecs-spinner',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        processing: {
          selector: '.processing,.spinner',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        ecsPreload: {
          selector: '.ecs-preload',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        offerProcessingSpinner: {
          selector: '.offer-processing-spinner',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        loadingLogo: {
          selector: '.experian-loading-logo',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        spinnerModal: {
          selector: '.spinner-modal\\__text',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        processingSpinner: {
          selector: '.ecs-efp-module-processing',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
      }, args.elementQueries || {}),
    }));
  }
}
module.exports = ExperianSpinnerAwareScene;
