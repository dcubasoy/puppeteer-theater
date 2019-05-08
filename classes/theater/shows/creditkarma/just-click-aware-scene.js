const CreditKarmaSpinnerAwareScene = require('./spinner-aware-scene');
const CreditKarmaJustClickScene = require('./just-click.scene');
const Scene = require('../../scene');

const elementQueryArray = Object.keys(CreditKarmaJustClickScene.Selectors)
  .map(k => [k, { selector: CreditKarmaJustClickScene.Selectors[k], visibility: 'forbidden' }]);

class CreditKarmaJustClickSpinnerAwareScene extends CreditKarmaSpinnerAwareScene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}


class CreditKarmaJustClickAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}

module.exports = {
  WithSpinner: CreditKarmaJustClickSpinnerAwareScene,
  WithoutSpinner: CreditKarmaJustClickAwareScene,
};
