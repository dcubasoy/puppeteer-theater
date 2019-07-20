const YahooSpinnerAwareScene = require('./spinner-aware-scene');
const YahooJustClickScene = require('./just-click.scene');
const Scene = require('../../scene');

const elementQueryArray = Object.keys(YahooJustClickScene.Selectors)
  .map(k => [k, { selector: YahooJustClickScene.Selectors[k], visibility: 'forbidden' }]);

class YahooJustClickSpinnerAwareScene extends YahooSpinnerAwareScene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}

class YahooJustClickAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: elementQueryArray.concat(Object.keys(args.elementQueries || {})
        .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
    }));
  }
}

module.exports = {
  WithSpinner: YahooJustClickSpinnerAwareScene,
  WithoutSpinner: YahooJustClickAwareScene,
};
