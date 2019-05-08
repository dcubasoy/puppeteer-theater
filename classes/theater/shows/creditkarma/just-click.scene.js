const Scene = require('../../scene');

const Selectors = {
  ctaBannerBtn: 'div.banner-card-content.justify-between.justify-around-l > a',
  closeModalBtn: 'button.ck-modal-close',
};

class CreditKarmaJustClickScene extends Scene {
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
CreditKarmaJustClickScene.Selectors = Selectors;

module.exports = CreditKarmaJustClickScene;
