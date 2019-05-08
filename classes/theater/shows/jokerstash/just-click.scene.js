const Scene = require('../../scene');

const Selectors = {
  closeModalBtn: 'button[data-ng-bind="config.closeButton.text"]',
};

class JokerJustClickScene extends Scene {
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
JokerJustClickScene.Selectors = Selectors;

module.exports = JokerJustClickScene;
