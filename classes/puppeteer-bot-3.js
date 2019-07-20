/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */

const toughCookie = require('tough-cookie');
const puppeteer = require('puppeteer-firefox');
const tmp = require('tmp');
const util = require('util');
const zlib = require('zlib');
const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const tar = require('tar');
const Redis = require('ioredis');
const request = require('request');
const assert = require('assert');
const uuid = require('uuid');
const crypto = require('crypto');
const os = require('os');
const debugConsole = require('debug')('puppeteer-bot-3:console');
const debug = require('debug')('puppeteer-bot-3');
const brotliDecompress = require('brotli/decompress');
const _ = require('lodash');
const shortid = require('shortid');
const geoip = require('geoip-lite');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const redis = new Redis(process.env.LOCAL_REDIS_URI || undefined);
const createLogger = require('../utils/logger');


const rp = opt => new Promise((resolve, reject) => request(opt, (err, resp, body) => {
  if (err) return reject(err);
  return resolve([resp, body]);
}));
const wait = ms => new Promise(r => setTimeout(r, ms));

function uppercaseObjKeys(o) {
  return Object.keys(o)
    .map(k => ({ startName: k, newName: k.split('-').map(kp => kp.charAt(0).toUpperCase() + kp.slice(1)).join('-') }))
    .reduce((prev, cur) => {
      const newKey = {};
      newKey[cur.newName] = o[cur.startName];
      return Object.assign(newKey, prev);
    }, {});
}

function getURLCacheKey() {
  return `puppeteer-bot-3-url-parsed-cache:${parseInt(Date.now() / 1000 / 60 / 60 / 6, 10)}:h`;
}

async function puppeteerErrorRetry(fn) {
  let lastError = null;

  for (let i = 0; i < 300; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (error) {
      if (!/Cannot find context with specified id/.test(error.message)
        && !/Session closed\. Most likely the page has been closed/.test(error.message)
        && !/Protocol error \(Runtime\.callFunctionOn\): Target closed/.test(error.message)
        && !/Session error \(Runtime\.callFunctionOn\): Message timed out/.test(error.message)
        && !/Execution context was destroyed/.test(error.message)
      ) throw error;
      lastError = error;
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, 100));
  }

  throw lastError;
}


const HeaderOrders = ['Host', 'Connection', 'Accept-Encoding', 'Accept-Language', 'User-Agent', 'Accept', 'Referer'];
const OmittedHeaders = ['X-Devtools-Emulate-Network-Conditions-Client-Id'];
async function fetchURLResponse({
  req, proxy, raw = false, bot = {},
}) {
  let headers = uppercaseObjKeys(req.headers);

  if (!headers.Connection) headers.Connection = 'keep-alive';
  if (!headers.Host) headers.Host = url.parse(req.url).host;

  headers = Object.keys(headers)
    .filter(k => !~OmittedHeaders.concat(bot.anonymizeReferer ? ['Referer'] : []).indexOf(k))
    .sort((a, b) => {
      const orderA = HeaderOrders.indexOf(a);
      const orderB = HeaderOrders.indexOf(b);

      return (~orderA ? orderA : Number.MAX_SAFE_INTEGER) - (
        ~orderB ? orderB : Number.MAX_SAFE_INTEGER);
    })
    .reduce((p, c) => Object.assign(p, { [c]: headers[c] }), {});

  const jar = bot && bot.getRequestCookieJar && await bot.getRequestCookieJar();
  const [resp, body] = await rp({
    url: req.url,
    headers,
    gzip: true,
    proxy,
    forever: true,
    encoding: null,
    strictSSL: false,
    followRedirect: false,
    maxRedirects: 0,
    followAllRedirects: false,
    jar,
  });

  if (bot && bot.page) {
    const cookies = (Array.isArray(resp.headers['set-cookie']) ? resp.headers['set-cookie'] : [resp.headers['set-cookie']])
      .filter(s => !!s)
      .map(str => toughCookie.parse(str).toJSON())
      .map(c => Object.assign(c, {
        name: c.key,
        expires: !c.expires ? undefined : Date.parse(c.expires) / 1000,
        session: !c.expires,
      }))
      .map((c) => {
        // eslint-disable-next-line no-param-reassign
        if (_.isNaN(c.expires)) delete c.expires;
        return c;
      });
    if (cookies.length > 0) {
      await bot.page.setCookie(...cookies);
    }
  }

  if (!resp.headers['content-length']) {
    Object.assign(resp.headers, { 'content-length': body.length });
  }

  let decodedBody = body;
  if (resp.headers['content-encoding'] === 'br') {
    decodedBody = Buffer.from(brotliDecompress(body));
  }

  return (raw ? s => s : JSON.stringify)({
    status: resp.statusCode,
    headers: resp.headers,
    body: raw ? decodedBody : decodedBody.toString('base64'),
  });
}

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const buffers = [];
    stream.on('error', reject);
    stream.on('data', data => buffers.push(data));
    stream.on('end', () => resolve(Buffer.concat(buffers)));
  });
}


const ATI = 'ATI Technologies Inc.';
const NVIDIA = 'NVIDIA Corporation';
const INTEL = 'Intel Inc.';

const MAC = 'MacIntel';
const WIN = 'Win32';

function factorBasedPopulate(array) {
  array.sort((a, b) => a.factor - b.factor);

  let multiFactor = 1;
  const min = array[0];

  for (;;) {
    const calc = parseInt(min.factor * multiFactor, 10);
    if (calc < 1) multiFactor *= 2;
    else if (calc > 1) multiFactor /= 2;
    else break;
  }

  const result = [];
  array.forEach((o) => {
    const count = parseInt(o.factor * multiFactor, 10);
    for (let i = 0; i < count; i += 1) {
      const obj = Object.assign({ bucket: i }, o);
      delete obj.factor;
      result.push(obj);
    }
  });

  return result;
}

const BROWSER_FINGERPRINTS = {
  SCREEN_RESOLUTIONS: factorBasedPopulate([
    { WIDTH: 1366, HEIGHT: 768, factor: 0.28 },
    { WIDTH: 1920, HEIGHT: 1080, factor: 0.18 },
    { WIDTH: 1440, HEIGHT: 900, factor: 0.07 },
    { WIDTH: 1600, HEIGHT: 900, factor: 0.05 },
    { WIDTH: 1280, HEIGHT: 800, factor: 0.05 },
    { WIDTH: 1024, HEIGHT: 768, factor: 0.05 },
    { WIDTH: 1280, HEIGHT: 1024, factor: 0.05 },
    { WIDTH: 1536, HEIGHT: 864, factor: 0.05 },
    { WIDTH: 1280, HEIGHT: 720, factor: 0.05 },
  ]),

  GL_PARAMETERS: [
    { VENDOR: ATI, RENDERER: 'AMD Radeon Pro 450 OpenGL Engine' },
    { VENDOR: ATI, RENDERER: 'AMD Radeon Pro 455 OpenGL Engine' },
    { VENDOR: ATI, RENDERER: 'AMD Radeon Pro 460 OpenGL Engine' },
    { VENDOR: ATI, RENDERER: 'AMD Radeon Pro 560 OpenGL Engine' },
    { VENDOR: ATI, RENDERER: 'AMD Radeon Pro 580 OpenGL Engine' },
    { VENDOR: NVIDIA, RENDERER: 'NVIDIA GeForce GTX 1080 Ti' },
    { VENDOR: NVIDIA, RENDERER: 'NVIDIA GeForce GTX 1080' },
    { VENDOR: NVIDIA, RENDERER: 'NVIDIA GeForce GTX 1070' },
    { VENDOR: NVIDIA, RENDERER: 'NVIDIA GeForce GTX 1070 Ti' },
    { VENDOR: NVIDIA, RENDERER: 'NVIDIA GeForce GTX 1060 6GB' },
    { VENDOR: NVIDIA, RENDERER: 'NVIDIA GeForce GTX 1060 3GB' },
    { VENDOR: NVIDIA, RENDERER: 'NVIDIA GeForce GTX 980 Ti' },
    { VENDOR: INTEL, RENDERER: 'Intel(R) Iris(TM) Graphics 540' },
    { VENDOR: INTEL, RENDERER: 'Intel(R) Iris(TM) Graphics 550' },
    { VENDOR: INTEL, RENDERER: 'Intel(R) Iris(TM) Graphics 650' },
    { VENDOR: INTEL, RENDERER: 'Intel(R) Iris(TM) Pro Graphics 6200' },
  ],
  USER_AGENTS: [
    { PLATFORM: MAC, UA: 'Macintosh; Intel Mac OS X 10_13_3' },
    { PLATFORM: MAC, UA: 'Macintosh; Intel Mac OS X 10_13_4' },
    { PLATFORM: MAC, UA: 'Macintosh; Intel Mac OS X 10_11_6' },
    { PLATFORM: MAC, UA: 'Macintosh; Intel Mac OS X 10_10_6' },
    { PLATFORM: WIN, UA: 'Windows NT 10.0; Win64; x64' },
    { PLATFORM: WIN, UA: 'Windows NT 6.1; Win64; x64' },
  ],
};

function calculateObjectHash(obj, h) {
  let hash = h;
  if (!h) {
    hash = crypto.createHash('sha512');
  }

  if (Array.isArray(obj)) obj.forEach(v => calculateObjectHash(v, hash));
  else if (typeof obj === 'function') hash.update(obj.toString());
  else if (typeof obj === 'number') hash.update(`${obj}`);
  else if (Buffer.isBuffer(obj)) hash.update(obj);
  else if (typeof obj === 'object') {
    Object
      .getOwnPropertyNames(obj)
      .forEach(n => hash.update(n) && calculateObjectHash(obj[n], hash));
  } else hash.update(obj);

  if (!h) return hash.digest();
  return null;
}

function calculateDistance(a, b) {
  const bufA = (Buffer.isBuffer(a) && a.length === 64) ? a : crypto.createHash('sha512').update(a).digest();
  const bufB = (Buffer.isBuffer(b) && b.length === 64) ? b : crypto.createHash('sha512').update(b).digest();

  let diff = 0;
  for (let i = 0; i < 64; i += 1) {
    diff += Math.abs(bufA[i] - bufB[i]);
  }

  return diff;
}

const UINT32_MAX = (2 ** 32) - 1;
function getClosestFingerprint(buid) {
  const buidHash = crypto.createHash('sha512').update(buid).digest();
  const calculateScore = o => Object.assign({ score: calculateDistance(o.hash, buidHash) }, o);
  const compare = (a, b) => a.score - b.score;

  const SCREEN_RESOLUTION = BROWSER_FINGERPRINTS.SCREEN_RESOLUTIONS
    .map(calculateScore).sort(compare)[0];

  const USER_AGENT = BROWSER_FINGERPRINTS.USER_AGENTS
    .map(calculateScore).sort(compare)[0];

  let GL_PARAMETER = BROWSER_FINGERPRINTS.GL_PARAMETERS
    .map(calculateScore).sort(compare)[0];

  if (USER_AGENT.PLATFORM === WIN) {
    GL_PARAMETER = {
      VENDOR: 'Google Inc.',
      RENDERER: `ANGLE (${GL_PARAMETER.RENDERER.replace(/ OpenGL Engine$/, '')} Direct3D11 vs_5_0 ps_5_0)`,
    };
  }

  return {
    SCREEN_RESOLUTION,
    USER_AGENT,
    GL_PARAMETER,
    BUID: buidHash.toString('base64'),
    random(index) {
      const idx = index % 124;
      if (idx < 62) return buidHash.readUInt32BE(idx) / UINT32_MAX;
      return buidHash.readUInt32LE(idx - 62) / UINT32_MAX;
    },
  };
}

[].concat(...['SCREEN_RESOLUTIONS', 'GL_PARAMETERS', 'USER_AGENTS'].map(k => BROWSER_FINGERPRINTS[k])).forEach(p => Object.assign(p, { hash: calculateObjectHash(p) }));

function isVisible(obj) {
  let style;

  if (obj === document) return true;

  if (!obj) return false;
  if (!obj.parentNode) return false;
  if (obj.style) {
    if (/^none/i.test(obj.style.display)) return false;
    if (/^hidden/i.test(obj.style.visibility)) return false;
  }

  // Try the computed style in a standard way
  // eslint-disable-next-line no-undef
  if (window.getComputedStyle) {
    // eslint-disable-next-line no-undef
    style = window.getComputedStyle(obj, '');
    if (/^none/i.test(style.display)) return false;
    if (/^none/i.test(style.visibility)) return false;
  }

  // Or get the computed style using IE's silly proprietary way
  style = obj.currentStyle;
  if (style) {
    if (/^none/i.test(style.display)) return false;
    if (/^none/i.test(style.visibility)) return false;
  }

  return isVisible(obj.parentNode);
}


class PuppeteerBot3 {
  constructor({
    userId,
    proxy,
    label = 'puppeteer-bot-3',
    urlCacheSkipRules,
    requestSoftAbortRules = [],
    requestHardAbortRules = [],
    browserTimeout = 45 * 60 * 1000,
    minWidth = 1024,
    minHeight = 1080,
    logger,
    requestURLReplacer = r => r.url(),
    preferNonHeadless = false,
    enableRequestInterception = true,
  } = {}) {
    this.userId = userId || shortid.generate();
    this.proxy = proxy;

    this.cleanUps = [];
    this.requestIds = [];

    this.logger = logger || createLogger(this.label);
    this.label = label;

    this.healthCheckTimeout = undefined;
    this.browserTimeout = browserTimeout;

    this.browserUniqueID = this.userId;

    this.urlCacheSkipRules = urlCacheSkipRules;
    this.requestSoftAbortRules = requestSoftAbortRules;
    this.requestHardAbortRules = requestHardAbortRules;
    this.requestURLReplacer = requestURLReplacer;

    this.minWidth = minWidth;
    this.minHeight = minHeight;

    this.preferNonHeadless = preferNonHeadless;
    this.enableRequestInterception = enableRequestInterception;
  }

  static async disguisePage(page, {
    userAgentReplacementRules = [],
    browserUniqueID,
    logger,
    minWidth = 1024,
    minHeight = 768,
    disguiseFlags = [],
  } = {}) {
    const FINGERPRINT = getClosestFingerprint(browserUniqueID || uuid());
    const USER_AGENT_REPLACE_RULES = []
      .concat([['headless', '']])
      .concat([['(Mozilla/[^ ]+ \\()[^)]+', `$1${FINGERPRINT.USER_AGENT.UA}`]])
      .concat(userAgentReplacementRules);

    logger.info(`fingerprint-resolution-${FINGERPRINT.SCREEN_RESOLUTION.WIDTH}-${FINGERPRINT.SCREEN_RESOLUTION.HEIGHT}`, { skipList: true });
    logger.info(`fingerprint-gl-vendor-${FINGERPRINT.GL_PARAMETER.VENDOR}`, { skipList: true });
    logger.info(`fingerprint-gl-renderer-${FINGERPRINT.GL_PARAMETER.RENDERER}`, { skipList: true });
    logger.info(`fingerprint-ua-platform-${FINGERPRINT.USER_AGENT.PLATFORM}`, { skipList: true });
    logger.info(`fingerprint-ua-ua-${FINGERPRINT.USER_AGENT.UA}`, { skipList: true });

    const LOG_OVERRIDE = false;
    if (LOG_OVERRIDE) {
      await page.on('console', (msg) => {
        if (msg && msg.text) {
          if (typeof msg.text === 'function') {
            debugConsole('PAGE LOG:', msg.text());
          } else {
            debugConsole('PAGE LOG:', msg.text);
          }
        } else {
          debugConsole('PAGE LOG:', msg);
        }
      });
      await page.on('pageerror', err => debug('PAGE ERR:', err));
    }

    const DIMENSION = {
      isLandscape: true,
      width: minWidth > FINGERPRINT.SCREEN_RESOLUTION.WIDTH ? minWidth
        : (parseInt(minWidth + (FINGERPRINT.random(0)
          * (FINGERPRINT.SCREEN_RESOLUTION.WIDTH - minWidth)), 10)),
      height: minHeight > FINGERPRINT.SCREEN_RESOLUTION.HEIGHT ? minHeight
        : (parseInt(minHeight + (FINGERPRINT.random(1)
          * (FINGERPRINT.SCREEN_RESOLUTION.HEIGHT - minHeight)), 10)),
    };

    /* eslint-disable no-undef, no-restricted-properties, no-underscore-dangle */
    await page.evaluateOnNewDocument((UA_RULE, fingerprint, LO, isVisibleStr, D, flags) => {
      const F = new Set(flags);
      setTimeout(() => {
        // eslint-disable-next-line no-restricted-syntax
        for (const name in this) {
          // eslint-disable-next-line no-continue
          if (name === 'webkitStorageInfo') continue;
          try {
            // Check CoinHive like miners
            if (this[name]
              && typeof this[name] !== 'undefined'
              && typeof this[name].isRunning === 'function'
              && typeof this[name].stop === 'function'
              && (typeof this[name]._siteKey === 'string' || typeof this[name]._newSiteKey === 'string' || typeof this[name]._address === 'string')
            ) {
              // eslint-disable-next-line no-console
              console.log('[+] Coinhive miner found, stopping...');
              this[name].stop();
              this[name] = null;
            }

            // Check Mineralt miners
            if (this[name]
              && typeof this[name] !== 'undefined'
              && typeof this[name].db === 'function'
              && typeof this[name].getlf === 'function'
              && typeof this[name].stop === 'function'
              && typeof this[name].hps === 'function'
            ) {
              // eslint-disable-next-line no-console
              console.log('[+] Mineralt miner found, stopping...');
              this[name].stop();
              this[name] = null;
            }
          } catch (err) {
            // ignore
          }
        }
      }, 2000);

      // eslint-disable-next-line no-eval
      eval(isVisibleStr);
      window.eyIsVisible = isVisible;

      const logOverride = (key, value) => {
        if (!LO) return value;
        // eslint-disable-next-line no-console
        console.log(`Overriden: ${key}=${value}`);
        return value;
      };

      const userAgent = UA_RULE.reduce((str, r) => str.replace(new RegExp(r[0], 'ig'), r[1]), window.navigator.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3372.0 Safari/537.36');
      const appVersion = UA_RULE.reduce((str, r) => str.replace(new RegExp(r[0], 'ig'), r[1]), window.navigator.appVersion || '5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3372.0 Safari/537.36');

      function buildPlugin(spec) {
        const plugin = spec;
        plugin.length = spec.mimeTypes.length;
        spec.mimeTypes.forEach((m, i) => {
          plugin[i] = m;
          Object.assign(m, { enabledPlugin: plugin });
        });
        // eslint-disable-next-line no-param-reassign
        delete spec.mimeTypes;
        return plugin;
      }

      const plugins = {
        length: 4,
        0: buildPlugin({
          mimeTypes: [{
            type: 'application/x-google-chrome-pdf',
            suffixes: 'pdf',
            description: 'Portable Document Format',
            enabledPlugin: true,
          }],
          name: 'Chrome PDF Plugin',
          description: 'Portable Document Format',
          filename: 'internal-pdf-viewer',
        }),
        1: buildPlugin({
          mimeTypes: [{
            type: 'application/pdf',
            suffixes: 'pdf',
            description: '',
            enabledPlugin: true,
          }],
          name: 'Chrome PDF Viewer',
          description: '',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
        }),
        2: buildPlugin({
          mimeTypes: [
            {
              type: 'application/x-nacl',
              suffixes: '',
              description: 'Native Client Executable',
              enabledPlugin: true,
            }, {
              type: 'application/x-pnacl',
              suffixes: '',
              description: 'Portable Native Client Executable',
              enabledPlugin: true,
            },
          ],
          name: 'Native Client',
          description: '',
          filename: 'internal-nacl-plugin',
        }),
        3: buildPlugin({
          mimeTypes: [{
            type: 'application/x-ppapi-widevine-cdm',
            suffixes: '',
            description: 'Widevine Content Decryption Module',
            enabledPlugin: true,
          }],
          name: 'Widevine Content Decryption Module',
          description: 'Enables Widevine licenses for playback of HTML audio/video content. (version: 1.4.9.1070)',
          filename: fingerprint.USER_AGENT.PLATFORM === 'Win32' ? 'widevinecdmadapter.dll' : 'widevinecdmadapter.plugin',
        }),
      };

      window.screen.__defineGetter__('width', () => logOverride('width', fingerprint.SCREEN_RESOLUTION.WIDTH));
      window.screen.__defineGetter__('availWidth', () => logOverride('availWidth', fingerprint.SCREEN_RESOLUTION.WIDTH));
      window.__defineGetter__('innerWidth', () => logOverride('innerWidth', D.width));
      window.__defineGetter__('outerWidth', () => logOverride('outerWidth', D.width));
      window.screen.__defineGetter__('height', () => logOverride('height', fingerprint.SCREEN_RESOLUTION.HEIGHT));
      window.screen.__defineGetter__('availHeight', () => logOverride('availHeight', fingerprint.SCREEN_RESOLUTION.HEIGHT));
      window.__defineGetter__('innerHeight', () => logOverride('innerHeight', D.height - 74));
      window.__defineGetter__('outerHeight', () => logOverride('outerHeight', D.height));
      window.navigator.__defineGetter__('userAgent', () => logOverride('userAgent', userAgent));
      window.navigator.__defineGetter__('platform', () => logOverride('platform', fingerprint.USER_AGENT.PLATFORM));
      window.navigator.__defineGetter__('appVersion', () => logOverride('appVersion', appVersion));
      window.navigator.__defineGetter__('webdriver', () => logOverride('webdriver', undefined));

      window.__defineGetter__('MediaStreamTrack', () => logOverride('MediaStreamTrack', undefined));
      window.__defineGetter__('RTCPeerConnection', () => logOverride('RTCPeerConnection', undefined));
      window.__defineGetter__('RTCSessionDescription', () => logOverride('RTCSessionDescription', undefined));
      window.__defineGetter__('webkitMediaStreamTrack', () => logOverride('webkitMediaStreamTrack', undefined));
      window.__defineGetter__('webkitRTCPeerConnection', () => logOverride('webkitRTCPeerConnection', undefined));
      window.__defineGetter__('webkitRTCSessionDescription', () => logOverride('webkitRTCSessionDescription', undefined));
      window.navigator.__defineGetter__('getUserMedia', () => logOverride('getUserMedia', undefined));
      window.navigator.__defineGetter__('webkitGetUserMedia', () => logOverride('webkitGetUserMedia', undefined));

      window.navigator.__defineGetter__('plugins', () => logOverride('plugins', plugins));

      if (!F.has('-canvas')) {
        class WebGLRenderingContext {
          constructor(cvs) {
            this.extension = {
              UNMASKED_VENDOR_WEBGL: 37445,
              UNMASKED_RENDERER_WEBGL: 37446,
            };
            this.canvas = cvs;
            this.parameter = '';
            this.viewportWidth = cvs.width;
            this.viewportHeight = cvs.height;
            this.supportedExtensions = ['ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_color_buffer_half_float', 'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_filter_anisotropic', 'WEBKIT_EXT_texture_filter_anisotropic', 'EXT_sRGB', 'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_float_linear', 'OES_texture_half_float', 'OES_texture_half_float_linear', 'OES_vertex_array_object', 'WEBGL_color_buffer_float', 'WEBGL_compressed_texture_s3tc', 'WEBKIT_WEBGL_compressed_texture_s3tc', 'WEBGL_compressed_texture_s3tc_srgb', 'WEBGL_debug_renderer_info', 'WEBGL_debug_shaders', 'WEBGL_depth_texture', 'WEBKIT_WEBGL_depth_texture', 'WEBGL_draw_buffers', 'WEBGL_lose_context', 'WEBKIT_WEBGL_lose_context'];
          }

          getExtension() {
            return this.extension;
          }

          getParameter() {
            return this.extension;
          }

          getSupportedExtensions() {
            return this.supportedExtensions;
          }
        }

        const canvas = document.createElement('canvas');
        const canvasProto = Object.getPrototypeOf(canvas);
        const origGetContext = canvasProto.getContext;
        canvasProto.getContext = function getContext(...args) {
          const context = origGetContext && (origGetContext.call(this, ...args)
            || origGetContext.call(this, args[0]));
          if (!context) {
            logOverride('canvas.getContext', 'new WebGLRenderingContext()');
            return new WebGLRenderingContext(this);
          }
          return context;
        };
        canvasProto.getContext.toString = generateToString('getContext');
      }

      function hookPrototypeMethods(prefix, object) {
        // TODO: also hook getters
        if (!object) return;
        const originals = {};
        const prototype = Object.getPrototypeOf(object);
        Object
          .getOwnPropertyNames(prototype)
          .filter((n) => {
            try {
              return typeof prototype[n] === 'function';
            } catch (error) {
              return false;
            }
          })
          .forEach((n) => {
            originals[n] = prototype[n];
            // eslint-disable-next-line func-names
            prototype[n] = function fn(...args) {
              if (prefix === '2d' && (n === 'strokeText' || n === 'fillText')) {
                const temp = Array.from(args);
                temp[0] = fingerprint.BUID;
                temp[1] = Math.max(0, temp[1] - 2);
                temp[2] = Math.max(0, temp[2] - 2);
                originals[n].call(this, ...temp);
              }

              const result = originals[n].call(this, ...args);
              if (LO) {
                let jsonResult;
                try {
                  jsonResult = JSON.stringify(result);
                  // eslint-disable-next-line no-empty
                } catch (e) {}
                // eslint-disable-next-line no-console
                console.log('function called', prefix, n, JSON.stringify(args), 'result:', result, jsonResult, `${result}`);
              }
              return result;
            };
          });
      }

      const gls = [];
      try {
        gls.push(document.createElement('canvas').getContext('webgl'));
        gls.push(document.createElement('canvas').getContext('experimental-webgl'));
        // eslint-disable-next-line no-empty
      } catch (e) {}

      gls.forEach((gl) => {
        const glProto = Object.getPrototypeOf(gl);
        const origGetParameter = glProto.getParameter;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (gl) {
          glProto.getParameter = function getParameter(...args) {
            if (args[0] === debugInfo.UNMASKED_VENDOR_WEBGL) return logOverride('gl.getParameter.UNMASKED_VENDOR_WEBGL', fingerprint.GL_PARAMETER.VENDOR);
            if (args[0] === debugInfo.UNMASKED_RENDERER_WEBGL) return logOverride('gl.getParameter.UNMASKED_RENDERER_WEBGL', fingerprint.GL_PARAMETER.RENDERER);
            if (args[0] === 33901) return new Float32Array([1, 8191]);
            if (args[0] === 3386) return new Int32Array([16384, 16384]);
            if (args[0] === 35661) return 80;
            if (args[0] === 34076) return 16384;
            if (args[0] === 36349) return 1024;
            if (args[0] === 34024) return 16384;
            if (args[0] === 3379) return 16384;
            if (args[0] === 34921) return 16;
            if (args[0] === 36347) return 1024;

            return origGetParameter.call(this, ...args);
          };
        }
      });

      if (LO) {
        if (!F.has('-canvas')) {
          hookPrototypeMethods('webgl', document.createElement('canvas').getContext('webgl'));
          hookPrototypeMethods('experimental-webgl', document.createElement('canvas').getContext('experimental-webgl'));
          hookPrototypeMethods('2d', document.createElement('canvas').getContext('2d'));
          hookPrototypeMethods('canvas', canvas);
        }
        hookPrototypeMethods('screen', window.screen);
        hookPrototypeMethods('navigator', window.navigator);
        hookPrototypeMethods('history', window.history);
      }
    }, USER_AGENT_REPLACE_RULES, FINGERPRINT, LOG_OVERRIDE,
    isVisible.toString(), DIMENSION, disguiseFlags);
    /* eslint-enable */

    // refresh page to get navigator getter installed
    await page.goto('about:blank');

    // eslint-disable-next-line no-undef
    const UA = await page.evaluate(() => window.navigator.userAgent);
    await page.setUserAgent(UA);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
    });

    await page.setViewport(DIMENSION);
    await page.setDefaultNavigationTimeout(120000);
    await page.setDefaultTimeout(120000);
  }

  /* eslint-disable */
  async resolveCaptchaTask(task) {
    const [, captchaRequestBody] = await rp({
      url: 'https://api.anti-captcha.com/createTask',
      // eslint-disable-next-line no-await-in-loop
      method: 'post',
      body: {
        clientKey: process.env.ANTICAPTCHA_KEY,
        task,
      },
      json: true,
    });
    for (;;) {
      // eslint-disable-next-line no-await-in-loop
      await wait(2000);

      let captchaResponseBody;
      try {
        // eslint-disable-next-line no-await-in-loop
        const [, body] = await rp({
          url: 'https://api.anti-captcha.com/getTaskResult',
          // eslint-disable-next-line no-await-in-loop
          method: 'post',
          body: {
            clientKey: process.env.ANTICAPTCHA_KEY,
            taskId: captchaRequestBody.taskId,
          },
          json: true,
        });
        captchaResponseBody = body;
      } catch (e) {
        logger.error(e);
      }

      if (captchaResponseBody) {
        if (captchaResponseBody.errorId !== 0) {
          throw new Error(`errorId=${captchaResponseBody.errorId}. body=${JSON.stringify(captchaResponseBody)}`);
        }

        if (captchaResponseBody.status === 'ready' && captchaResponseBody.solution) {
          return captchaResponseBody.solution;
        }

        if (captchaResponseBody.status !== 'processing') {
          throw new Error(`undefined status=${captchaResponseBody.status}`);
        }
      }
    }
  }
  /* eslint-enable */


  async resolveCaptcha(buffer) {
    try {
      return ((await this.resolveCaptchaTask({
        type: 'ImageToTextTask',
        body: buffer.toString('base64'),
      })) || {}).text || '';
    } catch (error) {
      this.logger.error('failed-resolve-captcha', await this.dump({
        error,
        buffer: buffer.toString('base64'),
      }));
      throw error;
    }
  }

  async uploadBlob(file, contentType, buffer) {
    const container = 'puppeteer-bot-3-dump';
    const filename = `${this.label}-${parseInt(Date.now() / 1000 / 60 / 60 / 24 / 7, 10)}/${file}`;

    return new Promise((resolve, reject) => {
      const stream = azure.blob.createWriteStreamToBlockBlob(
        container,
        filename, {
          contentType,
          contentSettings: {
            contentType,
          },
        },
        (err) => {
          if (err) reject(err);
          resolve(`https://anonyblob2.blob.core.windows.net/${container}/${filename}`);
        },
      );
      stream.write(buffer);
      stream.end();
    });
  }


  async dump(rootObj = {}) {
    try {
      if (this.page) {
        const blobUrlContent = await this.uploadBlob(
          `content/${uuid()}-${Date.now()}.html`,
          'text/html',
          Buffer.from(await puppeteerErrorRetry(async () => this.page.content())),
        );
        Object.assign(rootObj, {
          blobUrlContent,
        });
      }
    } catch (error) {
      //
    }

    try {
      if (this.page) {
        const blobUrlScreenshot = await this.uploadBlob(
          `screenshots/${uuid()}-${Date.now()}.png`,
          'image/png',
          await puppeteerErrorRetry(async () => this.page.screenshot()),
        );
        Object.assign(rootObj, {
          blobUrlScreenshot,
        });
      }
    } catch (error) {
      //
    }
    return rootObj;
  }

  async init() {
    if (this.credential) {
      await this.importCredential(this.credential);
    }
    await this.startBrowser();
  }


  async deinit() {
    try {
      await this.stopBrowser();
    } catch (error) {
      this.logger.error('deinit-error', {
        error,
      });
    }
  }

  async fetchURLCache(req) {
    const response = await fetchURLResponse({
      req,
      bot: this,
    });
    const key = getURLCacheKey();
    const field = req.url;
    // prevent block
    redis.multi().hset(key, field, response).expire(key, 60 * 60 * 6).exec((error) => {
      if (error) this.logger.error('redis-url-cache-store-error');
    });

    const parsed = JSON.parse(response);
    parsed.body = Buffer.from(parsed.body, 'base64');
    return parsed;
  }

  async getURLCache(req) {
    try {
      const key = getURLCacheKey();
      const field = req.url;

      const response = await redis.hget(key, field);
      if (!response) return this.fetchURLCache(req);

      const parsed = JSON.parse(response);
      parsed.body = Buffer.from(parsed.body, 'base64');
      return parsed;
    } catch (error) {
      debug('redis-url-cache-error');
      return JSON.parse(await this.fetchURLCache(req));
    }
  }


  idleCallbackCalled(id) {
    if (this.idleCallbackResolves[id]) {
      this.idleCallbackResolves[id].resolve();
      delete this.idleCallbackResolves[id];
    }
  }


  async goto(u) {
    await this.page.goto(u);
    this.incompleteRequests = [];
  }

  async clickCheckbox(query, value = true) {
    return this.$$check(query, value);
  }

  async $$check(query, value = true) {
    const handles = await puppeteerErrorRetry(async () => this.page.$$(query));

    let worked = null;
    for (let i = 0; i < handles.length; i += 1) {
      const handle = handles[i];
      // eslint-disable-next-line no-await-in-loop
      const result = await this.checkElementHandle(handle, value);
      if (result !== null) worked = result || worked || false;
      // eslint-disable-next-line no-await-in-loop
      await puppeteerErrorRetry(async () => handle.dispose());
    }

    return worked;
  }


  async checkElementHandle(handle, value = true) {
    let worked = null;
    worked = worked || false;
    // eslint-disable-next-line no-await-in-loop
    while (await puppeteerErrorRetry(async () => (await handle.getProperty('checked')).jsonValue()) !== value) {
      // eslint-disable-next-line no-await-in-loop
      await this.clickElementHandle(handle);
      worked = true;
    }

    return worked;
  }


  async $$safeEval(q, fn, ...args) {
    try {
      return await puppeteerErrorRetry(async () => this.page.$$eval(q, fn, ...args));
    } catch (error) {
      if (/failed to find element[s]? matching selector/.test(error.message)) {
        return puppeteerErrorRetry(async () => this.page.evaluate(fn, [], ...args));
      }
      throw error;
    }
  }

  async captureToS3(name) {
    try {
      await Promise.all([
        (async () => this.uploadToS3('text/html', `${Date.now()}-${name}.html`, await this.page.content()))(),
        (async () => this.uploadToS3('image/png', `${name}-${Date.now()}.png`, await this.page.screenshot({
          fullPage: true,
        })))(),
      ]);
    } catch (error) {
      this.logger.error('captureToS3', {
        error,
      });
    }
  }

  async uploadToS3(ContentType, filename, Body) {
    if (!this.userId) return;
    try {
      await s3.upload({
        Body,
        Bucket: 'puppeteer-bots-3-dump',
        ContentType,
        Key: [process.env.NODE_ENV === 'production' ? 'prod' : 'dev', `${this.userId}/${filename}`].join('/'),
      }).promise();
    } catch (error) {
      this.logger.error('s3Upload', {
        error,
      });
    }
  }


  async $$(selector, shouldIncludeInvisible = false) {
    const includeInvisible = !!shouldIncludeInvisible;
    if (!this.internal$$batches) this.internal$$batches = [];

    const promise = new Promise((resolve, reject) => this.internal$$batches.push({
      resolve,
      reject,
      selector,
      includeInvisible,
      key: `${selector}:${includeInvisible}`,
    }));

    setImmediate(() => {
      if (!this.internal$$batches) return;

      // copy batches and reset global
      const batches = this.internal$$batches;
      this.internal$$batches = undefined;

      // map batches
      const argKeyMap = batches
        .reduce((m, c) => Object.assign(m, {
          [c.key]: [...(m[c.key] || []), c],
        }), {});

      (async () => {
        try {
          const aggregatedMap = await puppeteerErrorRetry(async () => {
            const map = await (await this.page.evaluateHandle(
              args => (args
                .map(arg => ({
                  key: arg.key,
                  result: Array.from(document.querySelectorAll(arg.selector)).filter((e) => {
                    if (arg.includeInvisible) return true;
                    const box = e.getBoundingClientRect();
                    if (box && box.width > 2) return true;
                    return false;
                  }),
                }))
                .filter(o => o.result.length > 0)
                // at this point, we are guaranteed that key is unique in the array
                .reduce((m, c) => Object.assign(m, {
                  [c.key]: c.result,
                }), {})),
              Object.values(argKeyMap).map(a => _.pick(a[0], 'selector', 'includeInvisible', 'key')),
            )).getProperties();

            await Promise.all(Object.keys(argKeyMap).map(async (key) => {
              let result = map.get(key);
              if (result) {
                // make it array of elements
                result = [...(await result.getProperties()).values()].map(e => e.asElement());
              }
              map.set(key, result);
            }));

            return map;
          });

          await Promise.all(Object.keys(argKeyMap).map(async (key) => {
            argKeyMap[key].forEach((b) => {
              try {
                b.resolve(aggregatedMap.get(key) || []);
              } catch (e) {
                this.logger('$$-resolve-error', {
                  error: e,
                });
              }
            });
          }));
        } catch (error) {
          this.logger('$$-aggregator-error', {
            error,
          });
          // if error, all batches fails with same error
          batches.forEach((b) => {
            try {
              b.reject(error);
            } catch (e) {
              this.logger('$$-reject-error', {
                error: e,
              });
            }
          });
        }
      })();
    });

    return promise;
  }

  async $fill(q, opt) {
    return this.$$fill(q, opt);
  }

  async $$fill(q, opt) {
    if (!opt) return false;

    const elementHandles = await this.page.$$(q);

    let worked = false;
    for (let i = 0; i < elementHandles.length; i += 1) {
      const handle = elementHandles[i];

      // eslint-disable-next-line no-await-in-loop
      worked = await this.fillElementHandle(handle, opt) || worked;
    }

    return worked;
  }

  async checkFillElementHandle(handle, opt) {
    return puppeteerErrorRetry(async () => {
      if (!opt) return false;

      let check;
      if (typeof opt === 'string') {
        check = opt;
      } else {
        check = opt.check || opt.value;
      }

      if (!(await handle.boundingBox()
          && await this.page.evaluate(isVisible, handle))) return false;

      const value = await (await handle.getProperty('value')).jsonValue();

      if (typeof check === 'function' && check(value)) return false;
      if (check === value) return false;

      return true;
    });
  }


  async $select(q, opt) {
    if (!opt) return false;

    const elementHandle = await this.page.$(q);
    if (!elementHandle) return false;
    await this.clickElementHandle(elementHandle);
    await elementHandle.type(opt, {
      delay: 250,
    });

    await new Promise(r => setTimeout(r, 50));
    await elementHandle.press('Enter', {
      delay: 250,
    });
    return true;
  }

  async fillElementHandle(handle, opt) {
    return puppeteerErrorRetry(async () => {
      if (!opt) return false;

      let check;
      let v;
      let retries = 10;
      if (typeof opt === 'string') {
        check = opt;
        v = opt;
      } else {
        v = opt.value;
        check = opt.check || opt.value;
        retries = opt.retries || retries;
      }

      if (!(await handle.boundingBox()
          && await this.page.evaluate(isVisible, handle))) return false;

      if (!await this.checkFillElementHandle(handle, opt)) return true;

      const maxLength = await this.page.evaluate((e) => {
        e.value = '';
        const len = parseInt(e.maxLength || e.getAttribute('maxLength') || 1000, 10);
        // eslint-disable-next-line no-restricted-globals
        if (!isFinite(len)) return 0;
        return len;
      }, handle);

      // await this.clickElementHandle(handle);
      await new Promise(r => setTimeout(r, opt.delayBeforeType || 50));
      const chars = `${v}`.split('');
      if (maxLength > 0 && chars.length > maxLength) {
        debug('input-validation-failed');
      }

      for (let j = 0; j < chars.length; j += 1) {
        try {
          // check focus before press key
          // eslint-disable-next-line no-await-in-loop
          if (!await this.page.evaluate(e => document.activeElement === e, handle)) {
            if (retries <= 0) debug('failed active element check');
            return this.fillElementHandle(handle, {
              value: v,
              check,
              retries: retries - 1,
            });
          }
          // eslint-disable-next-line no-await-in-loop
          await handle.press(chars[j], {
            delay: 20 + (Math.random() * (opt.delay || 5)),
          });
        } catch (error) {
          // eslint-disable-next-line no-await-in-loop
          debug(`error-press-key-${chars[j]}`);
        }
      }
      await handle.press('Tab', {
        delay: 20 + (Math.random() * (opt.delay || 5)),
      });
      return true;
    });
  }

  async $click(selector) {
    return this.$$click(selector);
  }

  async $$click(selector) {
    const elementHandles = await this.page.$$(selector);
    debug(`$$click: ${elementHandles.length} elements found`);
    let result = false;
    for (let i = 0; i < elementHandles.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      result = await this.clickElementHandle(elementHandles[i], {
        selector,
      }) || result;
    }
    return result;
  }

  async clickByLinkText(opt) {
    // eslint-disable-next-line quotes
    const text = opt.replace(/'/g, `', "'", '`);
    const elementHandles = await this.page.$x(`//a[contains(text(), '${text}')]`);
    if (!elementHandles) return false;
    await this.clickElementHandle(elementHandles[0]);
    return true;
  }

  async clickByButtonText(opt) {
    const text = opt.replace(/'/g, '\', "\'", \'');
    const elementHandles = await this.page.$x(`//button[contains(text(), '${text}')]`);
    await this.clickElementHandle(elementHandles[0]);
    return true;
  }

  async waitForNavigationOrSelector(selector, waitForNavOption = {
    waitUntil: 'networkIdle',
  }) {
    let resolved = false;
    try {
      console.time('waitForNavigationOrSelector');
      // eslint-disable-next-line no-unused-vars
      const result = await Promise.race([
        this.page.waitForNavigation(waitForNavOption),
        // eslint-disable-next-line consistent-return
        (async () => {
          while (!resolved) {
            // eslint-disable-next-line no-await-in-loop
            if (await PuppeteerBot3.puppeteerErrorRetry(async () => this.page.$(selector))) return `selector:${selector}`;
          }
        })(),
      ]);
      console.timeEnd('waitForNavigationOrSelector');
      console.log(JSON.stringify(waitForNavOption));
    } catch (error) {
      throw error;
    } finally {
      resolved = true;
    }
  }

  async clickElementHandle(handle, {
    selector,
  } = {}) {
    return puppeteerErrorRetry(async () => {
      if (!handle) {
        this.logger.warn('clickElementHandle-empty-handle', await this.dump({
          selector,
        }));
        return false;
      }

      const boundingBox = await handle.boundingBox();
      if (!boundingBox) {
        debug('clickElementHandle-empty-bounding-box');
        // return false;
      }
      debug('clickElementHandle: target bounding box', boundingBox);

      if (!await this.page.evaluate(isVisible, handle)) {
        this.logger.warn('clickElementHandle-invisible-handle', await this.dump({
          selector,
        }));
        return false;
      }

      let targetX;
      let targetY;

      for (let i = 0; ; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const {
          x,
          y,
          width,
          height,
          // eslint-disable-next-line no-await-in-loop
        } = await handle.boundingBox();
        targetX = parseInt(x + Math.min(Math.random() * width, width - 2) + 1, 10);
        targetY = parseInt(y + Math.min(Math.random() * height, height - 2) + 1, 10);

        // validate target point
        // eslint-disable-next-line no-await-in-loop
        const result = await this.page.evaluate((e, point) => {
          function contains(parent, child) {
            if (!child || !parent) return false;
            if (child === parent) return true;
            return contains(parent, child.parentElement);
          }

          const el = document.elementFromPoint(point.x, point.y);
          return {
            contains: contains(e, el) || contains(el, e),
            point: el.outerHTML,
            element: e.outerHTML,
          };
        }, handle, {
          x: targetX,
          y: targetY,
        });

        if (result && result.contains) break;
        if (i > 10) {
          debug('click-target-covered', {
            result,
            x,
            y,
            width,
            height,
            targetX,
            targetY,
          });
        }

        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 100));
      }

      // eslint-disable-next-line no-await-in-loop
      await this.page.mouse.move(targetX, targetY, {
        steps: 10 + parseInt(Math.random() * 50, 10),
      });
      // eslint-disable-next-line no-await-in-loop
      await this.page.mouse.click(targetX, targetY, {
        delay: 20 + parseInt(Math.random() * 50, 10),
      });

      return true;
    });
  }


  async waitForSelector(opt) {
    return this.page.waitForSelector(opt);
  }




  async loadProfileData() {

  }
  async startBrowser() {
    if (!this.userDataDir) {
      const [dir, callback] = await new Promise((resolve, reject) => (
        tmp.dir({
          unsafeCleanup: true,
        }, (err, d, c) => {
          if (err) return reject(err);
          return resolve([d, c]);
        })
      ));

      this.cleanUps.push(callback);
      this.userDataDir = dir;
      debug(`userDataDir: ${this.userDataDir}`);
    }

    if (!await fs.ensureDir(this.userDataDir)) console.warn(`browser-${this.userDataDir}-does-not-exist`);
    fs.writeFileSync(path.join(this.userDataDir, './prefs.js'), `
    // Nico
    user_pref("network.proxy.type", 1);
    user_pref("network.proxy.socks", '127.0.0.1');
    user_pref("network.proxy.socks_port", '9150');
   `);

    if (!this.browser) {
      const options = {
        headless: !this.preferNonHeadless,
        args: [`--profile ${this.userDataDir}`],
      };

      this.browser = await puppeteer.launch(options);
    }

    if (!this.page) {
      this.page = await this.browser.newPage();

      this.idleCallbackName = uuid().replace(/-/g, '');
      await this.page.exposeFunction(this.idleCallbackName, (id) => {
        this.idleCallbackCalled(id);
      });

      this.page.on('close', () => {
        this.page = null;
      });
    }
  }

  async stopBrowser() {
    try {
      if (this.page) {
        await this.page.close();
      }
    } catch (error) {
      this.logger.error('failed-page-close', await this.dump({
        error,
      }));
    } finally {
      this.page = null;
    }

    try {
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error) {
      this.logger.error('failed-browser-close', await this.dump({
        error,
      }));
    } finally {
      this.browser = null;
    }

    if (this.cleanUps) {
      debug(`cleanUps length: ${this.cleanUps.length}`);
      for (let i = 0; i < this.cleanUps.length; i += 1) {
        try {
          this.cleanUps[i]();
        } catch (error) {
          // eslint-disable-next-line no-await-in-loop
          this.logger.error('failed-call-cleanUp');
        } finally {
          this.cleanUps.splice(i, 1);
        }
      }
      this.cleanUps = [];
      this.userDataDir = null;
    }
  }

  async importCredential(zbuf) {
    await new Promise((resolve, reject) => {
      zlib.gunzip(Buffer.from(zbuf, 'base64'), (err, buf) => {
        if (err) return reject(err);
        this.parsedCredential = JSON.parse(buf.toString());
        return resolve();
      });
    });

    await this.loadCredentials();
  }

  async loadCredentials() {
    await this.loadCookies();
  }


  async loadUserData() {
    if (!this.parsedCredential || !this.userDataDir || this.parsedCredential.firefoxUserData.length < 1) return;

    const stream = await tar.x({
      cwd: this.userDataDir,
      gzip: true,
    });
    stream.end(Buffer.isBuffer(this.parsedCredential.firefoxUserData) ? this.parsedCredential.firefoxUserData : Buffer.from(this.parsedCredential.firefoxUserData, 'base64'));
  }

  async getRequestCookieJar() {
    const jar = request.jar();

    // eslint-disable-next-line no-underscore-dangle
    jar._jar = toughCookie.CookieJar.fromJSON({
      looseMode: true,
      // eslint-disable-next-line no-underscore-dangle
      cookies: (await this.page.cookies()).map(c => ({
        key: c.name,
        value: c.value,
        // CookieJar does not support session property
        expires: c.session ? undefined : (new Date(c.expires * 1000).toISOString()),
        // CookieJar MemoryCookieStore bug..
        domain: c.domain.replace(/^\./, ''),
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
      })),
    });
    return jar;
  }

  async getFirefoxProfileData() {
    assert(this.userDataDir, 'userDataDir is empty');

    try {
      const buf = await streamToBuffer(await tar.c({
        gzip: true,
        cwd: this.userDataDir,
      }, ['.']));

      return buf;
    } catch (error) {
      return Buffer.from('');
    }
  }

  async loadCookies() {
    if (!this.parsedCredential || !this.parsedCredential.cookies || !this.page) return;
    await Promise.all(this.parsedCredential.cookies.map(async (c) => {
      const expires = parseInt(Date.parse(c.expires) / 1000, 10);
      if (_.isNaN(expires) || !_.isFinite(expires)) {
        this.logger.warn('expires-nan', await this.dump({
          cookies: this.parsedCredential.cookies,
        }));
      }

      const cookie = {
        domain: c.domain,
        expires: _.isNaN(expires)
          ? parseInt(Date.now() / 1000, 10) + (60 * 60 * 24 * 365 * 3) : expires,
        httpOnly: c.httponly,
        name: c.name,
        path: c.path,
        secure: c.secure,
        value: c.value,
      };

      try {
        await this.page.setCookie(cookie);
        debug(`set-cookie:${JSON.stringify(cookie)}`);
      } catch (error) {
        this.logger.error('failed-setting-cookie', await this.dump({
          cookie,
        }));
      }
    }));
  }

  async exportCredential() {
    assert(this.page, 'page is empty');

    // eslint-disable-next-line no-underscore-dangle
    const cookies = await this.page.cookies();

    return new Promise(async (resolve, reject) => {
      try {
        return zlib.gzip(JSON.stringify({
          firefoxProfileData: (await this.getFirefoxProfileData()).toString('base64'),
          cookies: cookies.map(c => ({
            domain: c.domain,
            expires: new Date((c.expires || Date.now() / 1000) * 1000).toGMTString(),
            expiry: c.expires,
            httponly: c.httpOnly,
            name: c.name,
            path: c.path,
            secure: c.secure,
            value: c.value,
          })),
        }), (err, buf) => {
          if (err) return reject(err);
          return resolve(buf.toString('base64'));
        });
      } catch (error) {
        return reject(error);
      }
    });
  }
}


PuppeteerBot3.fetchURLResponse = fetchURLResponse;
PuppeteerBot3.puppeteerErrorRetry = puppeteerErrorRetry;

module.exports = PuppeteerBot3;
