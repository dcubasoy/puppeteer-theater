const Scene = require('../../scene');

class AmexSpinnerAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: Object.assign({
        circleSpinner: {
          selector: '.progress-circle.progress-indeterminate',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        placeholderSpinner: {
          selector: '#ioaonlineplaceholder',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        spinningIcon: {
          selector: '.spinner,.ajax-loader',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        progressSpinner: {
          selector: '.progress-circle,.progress-indeterminate',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        ajaxLoader: {
          selector: '.input-loader',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        loadingPlaceholder: {
          selector: '.loading',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        loader: {
          selector: '#Loading',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        }
      }, args.elementQueries || {}),
    }));
  }
}

module.exports = AmexSpinnerAwareScene;
