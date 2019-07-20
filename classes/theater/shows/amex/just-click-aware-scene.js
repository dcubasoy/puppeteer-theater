const AmexSpinnerAwareScene = require('./spinner-aware.scene');
const AmexJustClickScene = require('./just-click.scene');
const Scene = require('../../scene');

const elementQueryArray = Object.keys(AmexJustClickScene.Selectors)
  .map(k => [k, { selector: AmexJustClickScene.Selectors[k], visibility: 'forbidden' }]);

class AmexJustClickSpinnerAwareScene extends AmexSpinnerAwareScene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}


class AmexJustClickAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}

module.exports = {
  WithSpinner: AmexJustClickSpinnerAwareScene,
  WithoutSpinner: AmexJustClickAwareScene,
};
