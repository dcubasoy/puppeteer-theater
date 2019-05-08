const ExperianSpinnerAwareScene = require('./spinner-aware.scene');
const ExperianJustClickScene = require('./just-click.scene');
const Scene = require('../../scene');

const elementQueryArray = Object.keys(ExperianJustClickScene.Selectors)
  .map(k => [k, { selector: ExperianJustClickScene.Selectors[k], visibility: 'forbidden' }]);

class ExperianJustClickSpinnerAwareScene extends ExperianSpinnerAwareScene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}


class ExperianJustClickAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}

module.exports = {
  WithSpinner: ExperianJustClickSpinnerAwareScene,
  WithoutSpinner: ExperianJustClickAwareScene,
};
