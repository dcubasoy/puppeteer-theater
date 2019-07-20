const CapitalOneSpinnerAwareScene = require('./spinner-aware.scene');
const CapitalOneJustClickScene = require('./just-click.scene');
const Scene = require('../../scene');

const elementQueryArray = Object.keys(CapitalOneJustClickScene.Selectors)
  .map(k => [k, { selector: CapitalOneJustClickScene.Selectors[k], visibility: 'forbidden' }]);

class CapitalOneJustClickSpinnerAwareScene extends CapitalOneSpinnerAwareScene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}


class CapitalOneJustClickAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}

module.exports = {
  WithSpinner: CapitalOneJustClickSpinnerAwareScene,
  WithoutSpinner: CapitalOneJustClickAwareScene,
};
