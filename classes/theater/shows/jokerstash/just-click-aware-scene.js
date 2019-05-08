const JokerSpinnerAwareScene = require('./spinner-aware.scene');
const JokerJustClickScene = require('./just-click.scene');
const Scene = require('../../scene');

const elementQueryArray = Object.keys(JokerJustClickScene.Selectors)
  .map(k => [k, { selector: JokerJustClickScene.Selectors[k], visibility: 'forbidden' }]);

class JokerJustClickSpinnerAwareScene extends JokerSpinnerAwareScene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}


class JokerJustClickAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}

module.exports = {
  WithSpinner: JokerJustClickSpinnerAwareScene,
  WithoutSpinner: JokerJustClickAwareScene,
};
