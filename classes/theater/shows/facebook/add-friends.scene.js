const Scene = require('../../scene');
const FacebokJustClickAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../promise-condition');
class FacebookAddFriendsScene extends FacebokJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        step1Header: {
          selector: '.uiStepList',
          match: e => /Step 1/ig.test(e.innerText),
        },
        addFriendBtns: {
          selector: 'button',
          match: e => /Add Friend/ig.test(e.innerText),
        },
        nextBtn: {
          selector: 'a.rfloat.\_ohf',
        }
      },
      extensions: [
        new Scene.Extensions.PreventCurtainFall({playCount: 2}),
        new Scene.Extensions.Delay(),
        new Scene.Extensions.Click('addFriendBtns'),
        new Scene.Extensions.Scroll(5000, 5),
        new Scene.Extensions.Click('addFriendBtns'),
      ],
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();

    await this.elements.nextBtn.click();
  }
}

module.exports = FacebookAddFriendsScene;
