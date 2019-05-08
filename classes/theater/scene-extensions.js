const assert = require('assert');
const debug = require('debug');
const request = require('request');
const MailListener = require('mail-listener-next');
const _ = require('lodash');
const PromiseCondition = require('../../utils/promise-condition');


// Simply click all elements
class Click {
  constructor(arg = {}) {
    if (typeof arg === 'string') {
      this.only = arg;
    } else {
      this.only = arg.only;
      this.once = arg.once;
    }
  }

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
          if (worked) break;
        }
      }
    }
  }
}

// Simply gives specified delay (optional)
class Delay {
  constructor(ms = _.random(2000, 7500)) {
    this.ms = ms;
  }

  async play() {
    this.scene.log('Extensions.Delay:', 'delaying:', this.ms);
    await new Promise(r => setTimeout(r, this.ms));
  }
}


// Fork. like depth menu
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

// Make this scene persists
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

// reCAPTCHA v2
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
      }), gRecaptchaResponse);

    // todo: check for iframe, if iframe present, eval in seperate frame
  }
}


// Email OTP Interception (using mail-listener)
class EmailOTP {
  constructor(targetElementName, IMAPConfig) {
    this.targetElementName = targetElementName;
    this.IMAPConfig = IMAPConfig;
    assert(this.targetElementName, 'targetElementName undefined');
    assert(this.IMAPConfig, 'IMAPConfig undefined');
  }


  async match() {
    const element = this.scene.elements[this.targetElementName];
    if (!await element.visible()) return false;
    return true;
  }

  async play() {
    const element = this.scene.elements[this.targetElementName];
    this.scene.log('Extensions.EmailOTP:', 'IMAPConfig:', this.IMAPConfig);

    const mailListener = new MailListener(this.IMAPConfig);
    mailListener.start();

    let code;
    mailListener.on('mail', async (mail, seqno, attributes) => {
      const { subject, from } = mail;

      this.log('Email (subject): ', subject);
      this.log('Email (from): ', from);

      if (subject.includes('Verify your Apple ID email address')) {
        const { text } = mail;
        this.log('Found mail text: ', text);
        // eslint-disable-next-line prefer-destructuring
        code = text.match(/\d{6}/)[0];

        this.log('Found Code: ', code);
        await this.scene.setContext('code', code);
      }
    });

    mailListener.stop();

    this.scene.log('Extensions.EmailOTP:Code:', 'Code:', code);
    await element.fill(code);
  }
}


// GenericP Captcha
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
    if (!await element.visible() && !await targetElement.visible()) return false;
    return true;
  }

  async play() {
    const captchaElement = this.scene.elements[this.targetElementName];
    const answerElement = this.scene.elements[this.targetAnswerElement];

    // re-release bot
    const bot = await this.scene.show.bot();

    const captchaBody = await captchaElement.screenshot();
    const code = await bot.resolveCaptcha(Buffer.from(captchaBody, 'base64'));

    this.scene.log('Extensions.Captcha:', 'Captcha Response:', code);
    await answerElement.fill(code);
  }
}

module.exports = {
  Click,
  Delay,
  Fork,
  PreventCurtainFall,
  ReCAPTCHAv2,
  Captcha,
  EmailOTP,
};
