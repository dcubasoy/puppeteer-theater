const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneAccountUsersScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        header: {
          selector: 'h1.secondary-val-header',
          match: e => /Account Users/.test(e.innerText),
        },
        addNewUserBtn: {
          selector: 'span.cc-accountUsers-add-user-link',
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    await this.elements.addNewUserBtn.click();
  }
}

module.exports = CapitalOneAccountUsersScene;
