/* eslint-disable no-await-in-loop */
const assert = require('assert');
const _ = require('lodash');
const PromiseCondition = require('./promise-condition');
const wait = t => new Promise(r => setTimeout(r, t));

/**
 * @description Simply clicks all elements matching the given PuppteerBotElementQuery.
 *
 * @class Click
 */
class Click {
  constructor(arg = {}) {
    if (typeof arg === 'string') {
      this.only = arg;
    } else {
      this.only = arg.only;
      this.once = arg.once;
    }
  }

  /**
   * @description Checks for element visibility / forbidden attribute / once = true for clicking only the first element.
   *
   *
   * @memberOf Click
   */
  async play() {
    const elementNames = Object.keys(this.scene.elements);
    for (let i = 0; i < elementNames.length; i += 1) {
      let worked = false;
      if (!this.only || this.only === elementNames[i]) {
        const element = this.scene.elements[elementNames[i]];
        // eslint-disable-next-line no-await-in-loop
        if (element.query.visibility !== 'forbidden' && await element.visible()) {
          this.scene.log('Extensions.Click:', 'clicking element', elementNames[i]);
          // eslint-disable-next-line no-await-in-loop
          worked = await element.click();
          if (worked && this.once) break;
        }
      }
    }
  }
}


/**
 * @description Simply gives specified delay (Defaults: random number between 2000, 7500). Helpful for testing and bot detection evasion. :)
 *
 * @class Delay
 */
class Delay {
  constructor(ms = _.random(2000, 7500)) {
    this.ms = ms;
  }

  async play() {
    this.scene.log('Extensions.Delay:', 'delaying:', this.ms);
    await new Promise(r => setTimeout(r, this.ms));
  }
}

/**
 * @description Simply Scrolls for the given time (in ms), and repeats scrollRepeats (default = 5) times. Designed for infinite scrolling scenarios.
 *
 * @class Scroll
 */
class Scroll {
  constructor(ms = _.random(10000, 15000), repeats = 5) {
    this.ms = ms;
    this.scrollRepeat = repeats;
  }

  async play() {
    this.scene.log('Extensions.Scroll:', 'Scrolling:', this.ms);

    // re-release bot
    const bot = await this.scene.show.bot();
    let previousHeight;

    for (let i = 0; i < this.scrollRepeat; i += 1) {
      previousHeight = await bot.page.evaluate('document.body.scrollHeight');
      // eslint-disable-next-line no-await-in-loop
      await bot.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      // eslint-disable-next-line no-await-in-loop
      await bot.page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      // eslint-disable-next-line no-await-in-loop
      await bot.page.waitFor(this.ms);
    }
  }
}


/**
 * @description Fork. Its like a depth menu.
 *
 * @class Fork
 */
class Fork {
  constructor(forks) {
    this.forks = forks;
    this.forkedAt = Date.now();
    this.currentFork = null;
  }

  async match() {
    if (this.currentFork) {
      const scenes = await Promise.all(this.currentFork.Scenes.map(S => this.scene.show.scene(S)));

      if (await this.forkCurtainFallen(this.currentFork)) {
        this.scene.log('Extensions.Fork:', 'exit due to curtain fall');
        this.currentFork = null;
      } else if (await PromiseCondition.or(scenes.map(s => s.match()))) {
        this.scene.log('Extensions.Fork:', 'stay fork');
      } else {
        this.scene.log('Extensions.Fork:', 'stay fork - none got match');
      }
    }

    return !this.currentFork;
  }

  async forkCurtainFallen(fork) {
    const scenes = await Promise.all(fork.Scenes.map(S => this.scene.show.scene(S)));
    const targets = scenes.filter(s => !!s).filter(s => !s.generic);
    return PromiseCondition.and(
      targets.map(s => s.curtainFallen()),
    );
  }

  async curtainFallen() {
    return PromiseCondition.and(this.forks.map(f => this.forkCurtainFallen(f)));
  }

  async play() {
    // pick fork
    for (let i = 0; i < this.forks.length; i += 1) {
      const fork = this.forks[i];
      // eslint-disable-next-line no-await-in-loop
      if (!await this.forkCurtainFallen(fork)) {
        this.scene.log('Extensions.Fork:', 'forking scene:', fork.Scenes[0].name);
        this.currentFork = this.forks[i];
        this.scene.setContext(`extensions:fork:${this.scene.constructor.name}`, fork.name || fork.Scenes[0].name);
        // eslint-disable-next-line no-await-in-loop
        await this.forks[i].fork();
        this.forkedAt = Date.now();
        return;
      }
    }
  }
}

/**
 * @description Make this scene prevent the show's curtain from falling (for playCount = n = 1 = default) times. (important concept that is not obvious until you understand the purpose of theater)
 *
 * @class PreventCurtainFall
 */
class PreventCurtainFall {
  constructor({ playCount = 1 }) {
    this.playCount = playCount;
  }

  // eslint-disable-next-line class-methods-use-this
  async curtainFallen() {
    return this.playCount <= 0;
  }

  async play() {
    this.playCount -= 1;
    this.scene.log('Extensions.PreventCurtainFall:', 'playCount:', this.playCount);
  }
}


/**
 * @description Generic extension for solving Google ReCaptcha V2 challenges.
 // TODO: Add support for new nested iframes & callbacks.
 *
 * @class ReCAPTCHAv2
 */
class ReCAPTCHAv2 {
  constructor(targetElementName, siteKeyFn) {
    this.targetElementName = targetElementName;
    assert(this.targetElementName, 'targetElementName undefined');

    this.siteKeyFn = siteKeyFn || (els => Array
      .from(els)
      .map(e => e.getAttribute('data-sitekey'))
      .filter(s => !!s)[0]);
  }

  async match() {
    const element = this.scene.elements[this.targetElementName];
    if (!await element.eval(els => Array
      .from(els)
      .map(e => e.querySelector('#g-recaptcha-response'))
      .filter(e => !!e)
      .length)) return false;
    return true;
  }

  async play() {
    const element = this.scene.elements[this.targetElementName];

    // re-release bot
    const bot = await this.scene.show.bot();

    const websiteKey = element ? await element.eval(this.siteKeyFn) : await bot.page.evaluate(this.siteKeyFn);
    this.scene.log('Extensions.ReCAPTCHAv2:', 'websiteKey:', websiteKey);

    const { gRecaptchaResponse } = await bot.resolveCaptchaTask({
      type: 'NoCaptchaTaskProxyless',
      websiteURL: bot.page.url(),
      websiteKey,
    });

    this.scene.log('Extensions.ReCAPTCHAv2:', 'gRecaptchaResponse:', gRecaptchaResponse);

    await element.eval((els, captchaResponse) => Array
      .from(els)
      .map(e => e.querySelector('#g-recaptcha-response'))
      .forEach((e) => {
        e.value = captchaResponse;
        e.innerText = captchaResponse;
      }), gRecaptchaResponse);
  }
}


/**
 * @description Model for a generic login/authentication flow where username, password, captcha, are present and there exists a confirmation element you can rely on to indicate authentication succesful when this element is visible.
 *
 * @class Login
 */
class Login {
  constructor(usernameElementName, passwordElementName, targetCaptchaElementName, targetCaptchaAnswerElement, confirmationElementName, loginBtnElementName, captchaAttempts = 50) {
    this.usernameElementName = usernameElementName;
    this.passwordElementName = passwordElementName;
    assert(this.usernameElementName, 'usernameElementName undefined');
    assert(this.passwordElementName, 'passwordElementName undefined');

    this.captchaAttempts = this.captchaAttempts;
    this.targetCaptchaElementName = targetCaptchaElementName;
    this.targetCaptchaAnswerElement = targetCaptchaAnswerElement;
    assert(this.targetCaptchaElementName, 'targetCaptchaElementName undefined');
    assert(this.targetCaptchaAnswerElement, 'targetCaptchaAnswerElement undefined');

    this.loginBtnElementName = loginBtnElementName;
    this.confirmationElementName = confirmationElementName;
    assert(this.loginBtnElementName, 'loginBtnElementName undefined');
    assert(this.confirmationElementName, 'confirmationElementName undefined');
  }

  async match() {
    const bot = await this.scene.show.bot();

    const usernameElementName = this.scene.elements[this.usernameElementName];
    const passwordElementName = this.scene.elements[this.passwordElementName];
    const targetCaptchaElementName = this.scene.elements[this.targetCaptchaElementName];
    const loginBtnElementName = this.scene.elements[this.loginBtnElementName];

    // eslint-disable-next-line consistent-return
    this.internalBot.page.on('request', async (request) => {
      if (request.isNavigationRequest()) return false;
    });

    return !(!await usernameElementName.visible() || !await passwordElementName.visible() || !await targetCaptchaElementName.visible() || !await loginBtnElementName.visible());
  }

  async play() {
    const usernameElementName = this.scene.elements[this.usernameElementName];
    const passwordElementName = this.scene.elements[this.passwordElementName];

    const targetCaptchaElementName = this.scene.elements[this.targetCaptchaElementName];
    const targetCaptchaAnswerElementName = this.scene.elements[this.targetCaptchaAnswerElementName];

    const loginBtnElementName = this.scene.elements[this.loginBtnElementName];
    const confirmationElementName = this.scene.elements[this.confirmationElementName]; //  TODO: replace with function to be evaluated

    // re-release bot
    const bot = await this.scene.show.bot();

    do {
      await usernameElementName.fill(this.scene.show.context('username') || this.scene.show.context('tempUsername'));
      await passwordElementName.fill(this.scene.show.context('password') || this.scene.show.context('tempPassword'));

      // now solve captcha
      // TODO: add flag for captcha type

      const captchaBody = await targetCaptchaElementName.screenshot();
      const code = await bot.resolveCaptcha(captchaBody);
      this.scene.log('Extensions.Login:', 'Captcha Response', code);

      await targetCaptchaAnswerElementName.fill(code);

      await loginBtnElementName.click();
      this.scene.log('Extensions.Login:', 'Captcha Attempt #:', parseInt(this.captchaAttempts, 10));

      await bot.page.waitFor(5000);
    } while (PromiseCondition.not(confirmationElementName.visible()));
  }
}


/**
 * @description Extension for solving generic captcha challenge (ImageToText). `puppeteer-bot` internally suppports: `anti-captcha` and `2captcha`.
 *
 * @class Captcha
 */
class Captcha {
  constructor(targetElementName, targetAnswerElementName) {
    this.targetElementName = targetElementName;
    this.targetAnswerElement = targetAnswerElementName;
    assert(this.targetElementName, 'targetElementName undefined');
    assert(this.targetAnswerElement, 'targetAnswerElement undefined');
  }

  async match() {
    const element = this.scene.elements[this.targetElementName];
    const targetElement = this.scene.elements[this.targetAnswerElement];
    if (!await element.visible() || !await targetElement.visible()) return false;
    return true;
  }

  async play() {
    const captchaElement = this.scene.elements[this.targetElementName];
    const answerElement = this.scene.elements[this.targetAnswerElement];

    const bot = await this.scene.show.bot();

    const captchaBody = await captchaElement.screenshot();
    const code = await bot.resolveCaptcha(captchaBody);

    this.scene.log('Extensions.Captcha:', 'Captcha:', code);
    await answerElement.fill(code);
  }
}


module.exports = {
  Click,
  Delay,
  Scroll,
  Fork,
  PreventCurtainFall,
  ReCAPTCHAv2,
  Captcha,
  Login,
};
