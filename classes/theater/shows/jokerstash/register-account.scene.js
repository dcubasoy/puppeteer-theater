const Scene = require('../../scene');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class JokerStashRegistrationScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        registerHeader: {
          selector: 'h1',
          match: e => /Registration/.test(e.innerText),
        },
        usernameInput: {
          selector: '#login',
        },
        emailInput: {
          selector: '#email',
        },
        jabberInput: {
          selector: '#jabber',
        },
        ICQInput: {
          selector: '#icq',
        },
        captcha: {
          selector: '#captcha',
        },
        captchaImage: {
          selector: 'img.\\_captcha',
        },
        registerBtn: {
          selector: 'button.\\_btn.\\_btng',
        },
      },
      extensions: [
        new Scene.Extensions.Captcha('captchaImage', 'captcha'),
      ],
    }, args));
  }


  async match() {
    return PromiseCondition.and(super.match(), this.context('signupEnabled'));
  }


  async play() {
    await this.elements.usernameInput.fill(this.context('tempUsername'));
    await this.elements.emailInput.fill(this.context('tempEmail'));
    await this.elements.jabberInput.fill(this.context('tempJabber'));
    await this.elements.ICQInput.fill(this.context('tempICQ'));

    await super.play();
    await this.elements.registerBtn.click();
  }
}

module.exports = JokerStashRegistrationScene;
