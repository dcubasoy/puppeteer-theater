const assert = require('assert');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const debug = require('debug')('theater:show');
const shortid = require('shortid');
const util = require('util');
const packageJson = require('../../package.json');
const PromiseCondition = require('../../utils/promise-condition');
const Scene = require('./scene');

shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');

async function softexec(promise) {
  try {
    return await promise;
  } catch (error) {
    if (/Cannot find context with specified id undefined/.test(error.message)) return null;
    if (/Session closed\. Most likely the page has been closed/.test(error.message)) return null;
    if (/Protocol error \(Runtime\.callFunctionOn\): Target closed/.test(error.message)) return null;
    if (/Session error \(Runtime\.callFunctionOn\): Message timed out/.test(error.message)) return null;
    if (/Execution context was destroyed/.test(error.message)) return null;
    debug('softexec', error.stack);
    return null;
  }
}

async function errorRetry(fn, retries = 3) {
  let lastErrorMessage = '';
  for (let i = 0; ; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (error) {
      if (lastErrorMessage && lastErrorMessage !== error.message) i = 0;
      lastErrorMessage = error.message;
      if (i >= retries) throw error;
    }
  }
}

async function constancy(fn, count = 3, delay = 100) {
  let result;
  let resultSet;
  for (let i = 0; i < count; i += 1) {
    let current;
    try {
      // eslint-disable-next-line no-await-in-loop
      current = await fn();
    } catch (error) {
      current = error;
    }
    if (!resultSet) {
      result = current;
      resultSet = true;
    } else if (
      (result instanceof Error ? result.message : result)
      !== (current instanceof Error ? current.message : current)
    ) {
      return null;
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, delay));
  }

  if (result instanceof Error) throw result;
  return result;
}

class Show extends EventEmitter {
  constructor({
    Scenes = [],
    bot,
    logger,
    timeout = 2 * 60 * 1000,
  } = {}) {
    super();

    this.ref = shortid.generate();
    this.logger = logger || ey.logger(this.constructor.name);
    this.ctx = {};
    this.Scenes = Scenes || Object.values(this.constructor.Scenes) || [];
    this.Scenes.forEach((S, i) => assert(S.prototype instanceof Scene, `Scenes[${i}] ${S.name} is not valid Scene`));
    this.internalBot = bot;
    this.scenes = this.Scenes.map(S => new S({ show: this }));
    this.sceneLog = [];
    this.timeout = timeout;
  }

  async bot() {
    return this.internalBot;
  }

  static scenes(dir) {
    return fs.readdirSync(dir)
      .filter(f => /\.scene\.js$/.test(f))
      .map(f => path.join(dir, f))
      // eslint-disable-next-line global-require, import/no-dynamic-require
      .map(p => require(p))
      .reduce((p, c) => Object.assign(p, { [c.name]: c }), {});
  }

  context(key) {
    return this.ctx[key];
  }

  setContext(key, value) {
    if (this.ctx[key] === value) return;
    this.ctx[key] = value;
    debug('setting context', { key });
  }

  async result() {
    return {
      package: `${packageJson.name}@${packageJson.version}`,
      ref: this.ref,
      sceneLog: this.sceneLog,
    };
  }

  async scene(TargetScene) {
    if (TargetScene) {
      return this.scenes.find(s => s.constructor === TargetScene);
    }

    return constancy(async () => {
      const matchedScenes = (await Promise.all(
        this.scenes.map(async scene => ({ matched: await softexec(scene.match()), scene })),
      ))
        .filter(s => s && s.matched)
        .map(s => s.scene);
      if (matchedScenes.length > 1) {
        debug(`matchedScenes.length > 1: ${matchedScenes.map(s => s.constructor.name).sort()}`);
        assert(matchedScenes.length <= 1, `matchedScenes.length > 1: ${matchedScenes.map(s => s.constructor.name).sort()}`);
      }
      if (matchedScenes < 1) {
        return null;
      }
      debug('matched scenes:', matchedScenes[0].constructor.name);
      return matchedScenes[0];
    });
  }

  async playOnce(s) {
    const bot = await this.bot();
    if (bot && (!bot.page || !bot.browser)) {
      throw new Error('timeout-page-terminated');
    }

    // eslint-disable-next-line no-await-in-loop
    const scene = await this.scene(s);
    debug('scene', !!scene);
    if (scene) {
      // do play scene
      debug('Now Playing Scene:', scene.constructor.name);
      const startedAt = new Date();
      const log = {
        index: this.sceneLog.length,
        SceneName: scene.constructor.name,
        waitedFor: startedAt.getTime() - this.lastScenePlayedAt,
        startedAt: startedAt.toISOString(),
      };
      this.sceneLog.push(log);
      this.emit('sceneStartPlay', log);

      let err;
      try {
        // eslint-disable-next-line no-await-in-loop
        log.result = await scene.play();
      } catch (error) {
        err = error;
        if (!/Cannot find context with specified id undefined/.test(error.message)
          && !/Execution context was destroyed/.test(error.message)) {
          // eslint-disable-next-line no-await-in-loop
          const match = await softexec(scene.match());
          debug('scene play error', error.stack, 'matching current screen?', match);
          if (match) throw error;
        }
      } finally {
        this.lastScenePlayedAt = Date.now();
        log.finishedAt = new Date().toISOString();
        log.duration = Date.now() - startedAt.getTime();
        log.log = scene.log();
        if (err) log.error = err;
        this.emit('sceneEndPlay', log);
      }
      debug('Finished Playing Scene:', scene.constructor.name, '| Result:', !!log.result);
    }

    return scene;
  }

  async play({ InitialScene, UntilScene } = {}) {
    this.emit('showStartPlay', await this.result());

    let globalError;
    let InitScene = InitialScene;
    try {
      let previousScene = null;
      let continuousPlayCount = 0;
      for (
        this.lastScenePlayedAt = Date.now(); Date.now() - this.lastScenePlayedAt < this.timeout;
      ) {
        debug('play loop');

        // eslint-disable-next-line no-await-in-loop
        const bot = await this.bot();
        if (bot && (!bot.page || !bot.browser)) {
          throw new Error('timeout-page-terminated');
        }

        // debug('scene error retry');
        // eslint-disable-next-line no-await-in-loop, no-loop-func
        const scene = await errorRetry(async () => {
          const init = InitScene;
          InitScene = undefined;
          return this.playOnce(init);
        });
        // debug('scene error retry done');
        if (scene) {
          if (scene.constructor === UntilScene) return;

          if (previousScene === scene.constructor) {
            continuousPlayCount += 1;
          } else {
            previousScene = scene.constructor;
            continuousPlayCount = 0;
          }

          if (scene.continuousPlayLimit() < continuousPlayCount) {
            throw new Error('timeout-continuous-play-limit-exceeded'); // TODO: improve this
          }
        }

        const nonGenericScenes = this.scenes.filter(s => !s.generic);

        debug('curtain fallen check');
        // eslint-disable-next-line no-await-in-loop
        if (await PromiseCondition.and(nonGenericScenes.map(s => s.curtainFallen()))) {
          // eslint-disable-next-line no-await-in-loop
          const result = await this.result();
          debug('Show is over! result', util.inspect(result, { depth: null, maxArrayLength: null, breakLength: 0 }));
          return;
        }
      }

      throw new Error(504, 'show-match-timeout');
    } catch (error) {
      globalError = error;
      throw error;
    } finally {
      const result = await this.result();
      if (globalError) result.error = globalError;
      this.emit('showEndPlay', result);
    }
  }
}

module.exports = Show;
