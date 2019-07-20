const Scene = require('../../scene');

const Selectors = {
  addAccountBtn: 'a.orko-button-primary.orko-button',
  popoverBtns: 'div[data-test-id="popover-content"]',
};

class YahooJustClickScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: Object.keys(Selectors)
        .map(k => [k, { selector: Selectors[k], visibility: 'required:groupA' }])
        .concat(Object.keys(args.elementQueries || {})
          .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
      extensions: [new Scene.Extensions.Click({ once: true })],
    }));
  }
}
YahooJustClickScene.Selectors = Selectors;

module.exports = YahooJustClickScene;
