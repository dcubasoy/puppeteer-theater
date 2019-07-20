const Scene = require('../../scene');

const Selectors = {
  closeModalBtn: 'button[data-ng-bind="config.closeButton.text"]',
  confirmOTPBtn: 'a.layerCancel.uiOverlayButton.selected',
  okayBtn: '#globalContainer > div:nth-of-type(4) > div.uiContextualLayer.uiContextualLayerBelowLeft > div.\_kc > div > div.uiOverlayFooter > table.uiGrid.uiOverlayFooterGrid > tbody > tr > td.uiOverlayFooterButtons > button.layerConfirm.uiOverlayButton.selected',
  notNowBtn: 'input[value="Not now"]',
};

class FacebookJustClickScene extends Scene {
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
FacebookJustClickScene.Selectors = Selectors;

module.exports = FacebookJustClickScene;
