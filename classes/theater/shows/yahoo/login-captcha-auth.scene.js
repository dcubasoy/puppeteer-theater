const PromiseCondition = require('../../promise-condition');const YahooJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class YahooLoginCaptchaAuthScene extends YahooJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        header: {
          selector: '.recaptcha-challenge',
        },
        gRecaptcha: {
          selector: '.g-recaptcha',
          visibility: 'optional',
        },
        gRecaptchaResponse: {
          selector: '#g-recaptcha-response',
          visibility: 'optional',
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(this.elements.header.visible());
  }


  async play() {
    await super.play();
    this.setContinousPlayLimit('header', 5);
    const bot = await this.show.bot();

    const websiteKey = '6LdI1RoUAAAAANLaawo9A_xn2t5rzAIQOdiBmEkh';
    const captchaTask = { type: 'NoCaptchaTaskProxyless', websiteURL: 'https://login.yahoo.net', websiteKey };
    const { gRecaptchaResponse } = await bot.resolveCaptchaTask(captchaTask);

    this.log(`Got gRecaptchaResponse: ${gRecaptchaResponse}`);

    const recaptchaElement = await bot.page.$('#recaptcha-iframe');
    const frame = await recaptchaElement.contentFrame();

    await frame.evaluate((resp) => {
      document.querySelector('#g-recaptcha-response').innerHTML = resp;
      document.getElementById('recaptcha-submit').disabled = false;
      document.getElementById('recaptcha-submit').click();
    }, gRecaptchaResponse);
  }
}

module.exports = YahooLoginCaptchaAuthScene;
