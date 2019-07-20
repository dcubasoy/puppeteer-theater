const FacebookSpinnerAwareScene = require('./spinner-aware-scene');
const FacebookJustClickScene = require('./just-click.scene');
const Scene = require('../../scene');

const elementQueryArray = Object.keys(FacebookJustClickScene.Selectors)
  .map(k => [k, { selector: FacebookJustClickScene.Selectors[k], visibility: 'forbidden' }]);

class FacebookJustClickSpinnerAwareScene extends FacebookSpinnerAwareScene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}

class FacebookJustClickAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}

module.exports = {
  WithSpinner: FacebookJustClickSpinnerAwareScene,
  WithoutSpinner: FacebookJustClickAwareScene,
};
