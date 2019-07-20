const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneCreditCardsHomeScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        creditCardsHeader: {
          selector: 'div.col.align-center > h2',
          match: e => /What credit cards would you like to see/.test(e.innerText),
        },
        navSignInBtn: {
          selector: '#navtest-b-l1-signin',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
        new Scene.Extensions.Click('navSignInBtn'),
      ],
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    this.log('Landing page');
    await super.play();
  }
}

module.exports = CapitalOneCreditCardsHomeScene;
