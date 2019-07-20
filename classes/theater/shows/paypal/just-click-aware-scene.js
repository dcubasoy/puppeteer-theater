const PayPalSpinnerAwareScene = require('./spinner-aware.scene');
const PayPalJustClickScene = require('./just-click.scene');
const Scene = require('../../scene');

const elementQueryArray = Object.keys(PayPalJustClickScene.Selectors)
  .map(k => [k, { selector: PayPalJustClickScene.Selectors[k], visibility: 'forbidden' }]);

class PayPalJustClickSpinnerAwareScene extends PayPalSpinnerAwareScene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}


class PayPalJustClickAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}

module.exports = {
  WithSpinner: PayPalJustClickSpinnerAwareScene,
  WithoutSpinner: PayPalJustClickAwareScene,
};
