const util = require('util');
const debug = require('debug');
const SceneExtensions = require('./scene-extensions');
const PromiseCondition = require('./promise-condition');
const PuppeteerBotElement = require('./puppeteer-bot-element');

class Scene {
  constructor({
    show,
    elementQueries = {},
    extensions = [],
    generic = true,
  } = {}) {
    this.ctx = {};
    this.show = show;
    this.elements = Object.keys(elementQueries).map(key => [
      key,
      new PuppeteerBotElement({
        scene: this,
        show: this.show,
        query: elementQueries[key],
      }),
    ]).reduce((p, c) => Object.assign(p, {
      [c[0]]: c[1],
    }), {});
    this.extensions = extensions;
    this.extensions.forEach(e => Object.assign(e, { scene: this }));
    this.generic = generic;
    this.continuousPlayLimits = {};
    this.setContinousPlayLimit('base', 50);
    this.playLog = [];
    this.debug = debug(`theater:scene:${this.constructor.name}`);
  }

  log(...args) {
    if (args.length === 0) {
      const r = this.playLog;
      this.playLog = [];
      return r;
    }
    const str = util.format(...args);
    str.split('\n').forEach(s => this.playLog.push(`${new Date().toISOString()}: ${s}`));
    this.debug(str);
    return this.playLog;
  }

  continuousPlayLimit() {
    return Object.values(this.continuousPlayLimits).reduce((p, c) => p + c, 0);
  }

  setContinousPlayLimit(key, count) {
    this.continuousPlayLimits[key] = Math.max(this.continuousPlayLimits[key] || 0, count);
  }

  interaction() {
    const { show: { internalBot: { interaction } = {} } = {} } = this;
    if (!interaction) {
      throw new Error('InteractionDown');
    }
    return interaction;
  }

  context(key) {
    return this.show.context(key);
  }

  setContext(key, value) {
    this.log('setContext key:', key, 'value:', value);
    return this.show.setContext(key, value);
  }

  async match() {
    const matchContext = {};
    const matches = await Promise.all(Object.values(this.elements)
      .map(async e => e.match(matchContext)));

    return PromiseCondition.and(
      PromiseCondition.not(this.curtainFallen()),
      matches.find(m => !m) === undefined,
      Object.values(matchContext).map(b => !!b).find(m => !m) === undefined,
      ...this.extensions.map(e => (e.match ? e.match() : true)),
    );
  }

  // eslint-disable-next-line class-methods-use-this
  async curtainFallen() {
    // generic scene must always go on
    if (this.generic) return false;
    return PromiseCondition.and(
      ...this.extensions.filter(e => e.curtainFallen).map(e => e.curtainFallen()),
    );
  }

  async play() {
    try {
      const playableExensions = this.extensions.filter(e => e.play);
      for (let i = 0; i < playableExensions.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
        await playableExensions[i].play();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.trace(error);
    }
  }
}

Scene.Extensions = SceneExtensions;

module.exports = Scene;
