/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */

const toughCookie = require('tough-cookie');
const puppeteer = require('puppeteer');
const zlib = require('zlib');
const tmp = require('tmp');
const url = require('url');
const Redis = require('ioredis');
const request = require('request');
const tar = require('tar');
const assert = require('assert');
const uuid = require('uuid');
const crypto = require('crypto');
const os = require('os');
const brotliDecompress = require('brotli/decompress');
const debugConsole = require('debug')('puppeteer-bot-1:console');
const debug = require('debug')('puppeteer-bot');
const _ = require('lodash');
const shortid = require('shortid');
const AWS = require('aws-sdk');
const UserAgent = require('user-agents');
const geoip = require('geoip-lite');

const s3 = new AWS.S3();
const redis = new Redis(process.env.LOCAL_REDIS_URI || undefined);

const rp = opt => new Promise((resolve, reject) => request(opt, (err, resp, body) => {
  if (err) return reject(err);
  return resolve([resp, body]);
}));
const wait = ms => new Promise(r => setTimeout(r, ms));

function uppercaseObjKeys(o) {
  return Object.keys(o)
    .map(k => ({
      startName: k,
      newName: k.split('-').map(kp => kp.charAt(0).toUpperCase() + kp.slice(1)).join('-'),
    }))
    .reduce((prev, cur) => {
      const newKey = {};
      newKey[cur.newName] = o[cur.startName];
      return Object.assign(newKey, prev);
    }, {});
}

function getURLCacheKey() {
  return `puppeteer-bot-url-parsed-cache:${parseInt(Date.now() / 1000 / 60 / 60 / 6, 10)}:h`;
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


const WEBGL_RENDERERS = ['ANGLE (NVIDIA Quadro 2000M Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (NVIDIA Quadro K420 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA Quadro 2000M Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA Quadro K2000M Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (Intel(R) HD Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Family Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 3800 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (AMD Radeon R9 200 Series Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (Intel(R) HD Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Family Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Family Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics 4000 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics 3000 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Mobile Intel(R) 4 Series Express Chipset Family Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G33/G31 Express Chipset Family Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (Intel(R) Graphics Media Accelerator 3150 Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (Intel(R) G41 Express Chipset Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 6150SE nForce 430 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics 4000)', 'ANGLE (Mobile Intel(R) 965 Express Chipset Family Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Family)', 'ANGLE (NVIDIA GeForce GTX 760 Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (NVIDIA GeForce GTX 760 Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (NVIDIA GeForce GTX 760 Direct3D11 vs_5_0 ps_5_0)', 'ANGLE (AMD Radeon HD 6310 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Graphics Media Accelerator 3600 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G33/G31 Express Chipset Family Direct3D9 vs_0_0 ps_2_0)', 'ANGLE (AMD Radeon HD 6320 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G33/G31 Express Chipset Family (Microsoft Corporation - WDDM 1.0) Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (Intel(R) G41 Express Chipset)', 'ANGLE (ATI Mobility Radeon HD 5470 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Q45/Q43 Express Chipset Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 310M Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G41 Express Chipset Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (Mobile Intel(R) 45 Express Chipset Family (Microsoft Corporation - WDDM 1.1) Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 440 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 4300/4500 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 7310 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics)', 'ANGLE (Intel(R) 4 Series Internal Chipset Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon(TM) HD 6480G Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 3200 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 7800 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G41 Express Chipset (Microsoft Corporation - WDDM 1.1) Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 210 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 630 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 7340 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) 82945G Express Chipset Family Direct3D9 vs_0_0 ps_2_0)', 'ANGLE (NVIDIA GeForce GT 430 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 7025 / NVIDIA nForce 630a Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Q35 Express Chipset Family Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (Intel(R) HD Graphics 4600 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 7520G Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD 760G (Microsoft Corporation WDDM 1.1) Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 220 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 9500 GT Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Family Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Graphics Media Accelerator HD Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 9800 GT Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Q965/Q963 Express Chipset Family (Microsoft Corporation - WDDM 1.0) Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (NVIDIA GeForce GTX 550 Ti Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Q965/Q963 Express Chipset Family Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (AMD M880G with ATI Mobility Radeon HD 4250 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GTX 650 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Mobility Radeon HD 5650 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 4200 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 7700 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G33/G31 Express Chipset Family)', 'ANGLE (Intel(R) 82945G Express Chipset Family Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (SiS Mirage 3 Graphics Direct3D9Ex vs_2_0 ps_2_0)', 'ANGLE (NVIDIA GeForce GT 430)', 'ANGLE (AMD RADEON HD 6450 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon 3000 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) 4 Series Internal Chipset Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Q35 Express Chipset Family (Microsoft Corporation - WDDM 1.0) Direct3D9Ex vs_0_0 ps_2_0)', 'ANGLE (NVIDIA GeForce GT 220 Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 7640G Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD 760G Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 6450 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 640 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 9200 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 610 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 6290 Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Mobility Radeon HD 4250 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 8600 GT Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 5570 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 6800 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) G45/G43 Express Chipset Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 4600 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA Quadro NVS 160M Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics 3000)', 'ANGLE (NVIDIA GeForce G100)', 'ANGLE (AMD Radeon HD 8610G + 8500M Dual Graphics Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Mobile Intel(R) 4 Series Express Chipset Family Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 7025 / NVIDIA nForce 630a (Microsoft Corporation - WDDM) Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) Q965/Q963 Express Chipset Family Direct3D9 vs_0_0 ps_2_0)', 'ANGLE (AMD RADEON HD 6350 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (ATI Radeon HD 5450 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce 9500 GT)', 'ANGLE (AMD Radeon HD 6500M/5600/5700 Series Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Mobile Intel(R) 965 Express Chipset Family)', 'ANGLE (NVIDIA GeForce 8400 GS Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (Intel(R) HD Graphics Direct3D9 vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GTX 560 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 620 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GTX 660 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon(TM) HD 6520G Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA GeForce GT 240 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (AMD Radeon HD 8240 Direct3D9Ex vs_3_0 ps_3_0)', 'ANGLE (NVIDIA Quadro NVS 140M)', 'ANGLE (Intel(R) Q35 Express Chipset Family Direct3D9 vs_0_0 ps_2_0)'];

const UINT32_MAX = (2 ** 32) - 1;

function getBrowserfingerprint(buid, emulateFlag) {
  const generateUserAgent = new UserAgent({
    deviceCategory: emulateFlag,
  });

  const fingerprints = Array(10).fill().map(() => generateUserAgent());

  const WEBGL_PARAMETER = {
    WEBGL_VENDOR: 'Google Inc.',
    WEBGL_RENDERER: WEBGL_RENDERERS[Math.floor(Math.random() * WEBGL_RENDERERS.length)],
  };

  const fingerprint = Object.assign(fingerprints[Math.floor(Math.random() * fingerprints.length)].data, WEBGL_PARAMETER);

  const buidHash = crypto.createHash('sha512').update(buid).digest();
  fingerprint.BUID = buidHash.toString('base64');

  fingerprint.random = (index) => {
    const idx = index % 124;
    if (idx < 62) return buidHash.readUInt32BE(idx) / UINT32_MAX;
    return buidHash.readUInt32LE(idx - 62) / UINT32_MAX;
  };
  return fingerprint;
}

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

class PuppeteerBot {
  constructor({
    botId,
    proxy,
    credential,
    chromeUserData,
    label = 'puppeteer-bot',
    interaction,
    urlCacheSkipRules,
    requestSoftAbortRules = [],
    requestHardAbortRules = [],
    browserTimeout = 45 * 60 * 1000,
    minWidth = 1024,
    minHeight = 1080,
    anonymizeReferer = false,
    logger,
    trustChromeNativeRequest = false,
    requestURLReplacer = r => r.url(),
    preferNonHeadless = false,
    disguiseFlags = [],
    emulateFlag = 'desktop',
    revision,
    executablePath,
    browserless = false,
    torBrowsingEnabled = false,
  } = {}) {
    this.interaction = interaction;
    this.botId = botId || shortid.generate();
    this.proxy = proxy;
    this.credential = credential;
    this.chromeUserData = chromeUserData;

    this.cleanUps = [];
    this.requestIds = [];

    this.logger = logger || console.log.bind(console);
    this.label = label;

    this.healthCheckTimeout = undefined;
    this.browserTimeout = browserTimeout;

    this.browserUniqueID = uuid.v4();

    this.urlCacheSkipRules = urlCacheSkipRules;
    this.requestSoftAbortRules = requestSoftAbortRules;
    this.requestHardAbortRules = requestHardAbortRules;
    this.requestURLReplacer = requestURLReplacer;

    this.minWidth = minWidth;
    this.minHeight = minHeight;

    this.anonymizeReferer = anonymizeReferer;
    this.trustChromeNativeRequest = trustChromeNativeRequest;

    this.preferNonHeadless = preferNonHeadless;
    this.disguiseFlags = disguiseFlags;
    this.emulateFlag = emulateFlag;

    this.trustChromeNativeRequest = trustChromeNativeRequest;

    this.preferNonHeadless = preferNonHeadless;
    this.disguiseFlags = disguiseFlags; // NOTE: Deprecated temporarily (ALL flags are applied).

    this.revision = revision;
    this.executablePath = executablePath;
    this.browserless = browserless;

    this.tor = torBrowsingEnabled;
  }


  /**
   * Masks puppeteer to simulate a truly unique user browser fingerprint. Extremely useful for evading bot detection measures.
   */
  /**
   * @param  {} page: Puppeteer.page
   * @param  {} browserContext: Default browser context
   */
  static async disguisePage(page, browserContext, {
    browserUniqueID = uuid.v4(),
    logger,
    minWidth = 1280,
    minHeight = 1024,
    disguiseFlags = [],
    emulateFlag = 'desktop',
    geolocation,
  } = {}) {
    const fingerprint = getBrowserfingerprint(browserUniqueID, emulateFlag);


    logger.info(`fingerprint-webgl-vendor-${fingerprint.WEBGL_VENDOR}`);
    logger.info(`fingerprint-webgl-renderer-${fingerprint.WEBGL_RENDERER}`);
    logger.info(`fingerprint-ua-ua-${fingerprint.userAgent}`);
    logger.info(`fingerprint-ua-platform-${fingerprint.platform}`);
    logger.info(`fingerprint-deviceCategory-${fingerprint.deviceCategory}`);
    logger.info(`fingerprint-viewportHeight-${fingerprint.viewportHeight}`);
    logger.info(`fingerprint-viewportWidth-${fingerprint.viewportWidth}`);


    const LOG_OVERRIDE = true;
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
    }

    const DIMENSION = {
      isLandscape: true,
      width: minWidth > fingerprint.viewportWidth ? minWidth : (parseInt(minWidth + (fingerprint.random(0)
        * (fingerprint.screenWidth - minWidth)), 10)),
      height: minHeight > fingerprint.viewportHeight ? minHeight : (parseInt(minHeight + (fingerprint.random(1)
        * (fingerprint.screenHeight - minHeight)), 10)),
    };

    /*eslint-disable */
    await page.evaluateOnNewDocument(async (fingerprint, LO, D, flags) => {
      const F = new Set(flags); // TODO: F should contain evasions or disguise attributes to be applied. (Default: All)

      const logOverride = (key, value) => {
        if (!LO) return value;
        // eslint-disable-next-line no-console
        console.warn(`Overriden: ${key}=${value}`);
        return value;
      };

      function buildPlugin(spec) {
        const plugin = spec;
        plugin.length = spec.mimeTypes.length;
        spec.mimeTypes.forEach((m, i) => {
          plugin[i] = m;
          Object.assign(m, {
            enabledPlugin: plugin,
          });
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
            extensions: 'pdf',
            enabledPlugin: true,
          }],
          name: 'Chrome PDF Viewer',
          description: '',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
        }),
        2: buildPlugin({
          mimeTypes: [{
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
          {
            type: 'text/html',
            suffixes: '',
            description: '',
            enabledPlugin: true,
          },
          {
            type: 'application/x-ppapi-vysor',
            suffixes: '',
            description: '',
            enabledPlugin: true,
          },
          {
            type: 'application/x-ppapi-vysor-audio',
            suffixes: '',
            description: '',
            enabledPlugin: true,
          },
          ],
          name: 'Native Client',
          description: '',
          filename: fingerprint.platform === 'Win32' ? 'pepflashplayer.dll' : 'internal-nacl-plugin',
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
          filename: fingerprint.platform === 'Win32' ? 'widevinecdmadapter.dll' : 'widevinecdmadapter.plugin',
        }),
      };

      // TODO: Create this dynamically from fingerprint attributes
      const chrome = {
        app: {
          isInstalled: true,
        },
        webstore: {
          onInstallStageChanged: {},
          onDownloadProgress: {},
        },
        runtime: {
          PlatformOs: {
            MAC: 'mac',
            WIN: 'win',
            ANDROID: 'android',
            CROS: 'cros',
            LINUX: 'linux',
            OPENBSD: 'openbsd',
          },
          PlatformArch: {
            ARM: 'arm',
            X86_32: 'x86-32',
            X86_64: 'x86-64',
          },
          PlatformNaclArch: {
            ARM: 'arm',
            X86_32: 'x86-32',
            X86_64: 'x86-64',
          },
          RequestUpdateCheckStatus: {
            THROTTLED: 'throttled',
            NO_UPDATE: 'no_update',
            UPDATE_AVAILABLE: 'update_available',
          },
          OnInstalledReason: {
            INSTALL: 'install',
            UPDATE: 'update',
            CHROME_UPDATE: 'chrome_update',
            SHARED_MODULE_UPDATE: 'shared_module_update',
          },
          OnRestartRequiredReason: {
            APP_UPDATE: 'app_update',
            OS_UPDATE: 'os_update',
            PERIODIC: 'periodic',
          },
        },
      };


      window.chrome = chrome;

      // eslint-disable-next-line no-restricted-properties
      window.screen.__defineGetter__('width', () => logOverride('width', fingerprint.screenWidth));
      window.screen.__defineGetter__('availWidth', () => logOverride('availWidth', fingerprint.screenWidth));
      window.__defineGetter__('innerWidth', () => logOverride('innerWidth', D.width));
      window.__defineGetter__('outerWidth', () => logOverride('outerWidth', D.width));
      window.screen.__defineGetter__('height', () => logOverride('height', fingerprint.screenHeight));
      window.screen.__defineGetter__('availHeight', () => logOverride('availHeight', fingerprint.screenHeight));
      window.__defineGetter__('innerHeight', () => logOverride('innerHeight', D.height - 74));
      window.__defineGetter__('outerHeight', () => logOverride('outerHeight', D.height));

      window.navigator.__defineGetter__('userAgent', () => logOverride('userAgent', fingerprint.userAgent));
      window.navigator.__defineGetter__('platform', () => logOverride('platform', fingerprint.platform));
      window.navigator.__defineGetter__('appName', () => logOverride('appName', fingerprint.appName));

      // webdriver
      const newProto = window.navigator.__proto__;
      delete newProto.webdriver;
      navigator.__proto__ = newProto;

      window.navigator.__defineGetter__('languages', () => logOverride('languages', ['en-US,en']));
      window.navigator.__defineGetter__('plugins', () => logOverride('plugins', plugins));


      window.navigator.__defineGetter__('getUserMedia', () => logOverride('getUserMedia', undefined));
      window.navigator.__defineGetter__('webkitGetUserMedia', () => logOverride('webkitGetUserMedia', undefined));

      // reject webRTC fingerprinting
      window.__defineGetter__('MediaStreamTrack', () => logOverride('MediaStreamTrack', undefined));
      window.__defineGetter__('RTCPeerConnection', () => logOverride('RTCPeerConnection', undefined));
      window.__defineGetter__('RTCSessionDescription', () => logOverride('RTCSessionDescription', undefined));
      window.__defineGetter__('webkitMediaStreamTrack', () => logOverride('webkitMediaStreamTrack', undefined));
      window.__defineGetter__('webkitRTCPeerConnection', () => logOverride('webkitRTCPeerConnection', undefined));
      window.__defineGetter__('webkitRTCSessionDescription', () => logOverride('webkitRTCSessionDescription', undefined));

      class WebGLRenderingContext {
        constructor(cvs) {
          this.extension = {
            WEBGL_VENDOR: 37445,
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

      function hookPrototypeMethods(prefix, object) {
        // TODO: [BAC-4] also hook getters
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
                this.logger.verbose('function called', prefix, n, JSON.stringify(args), 'result:', result, jsonResult, `${result}`);
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
            if (args[0] === debugInfo.WEBGL_VENDOR) return logOverride('gl.getParameter.WEBGL_VENDOR', fingerprint.WEBGL_VENDOR);
            if (args[0] === debugInfo.WEBGL_RENDERER) return logOverride('gl.getParameter.WEBGL_RENDERER', fingerprint.WEBGL_RENDERER);
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

      hookPrototypeMethods('webgl', document.createElement('canvas').getContext('webgl'));
      hookPrototypeMethods('experimental-webgl', document.createElement('canvas').getContext('experimental-webgl'));
      hookPrototypeMethods('2d', document.createElement('canvas').getContext('2d'));
      hookPrototypeMethods('canvas', canvas);

      hookPrototypeMethods('screen', window.screen);
      hookPrototypeMethods('navigator', window.navigator);
      hookPrototypeMethods('history', window.history);
    }, fingerprint, LOG_OVERRIDE, DIMENSION, disguiseFlags);



    await page.evaluateOnNewDocument(() => {
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.__proto__.query = parameters => parameters.name !== 'notifications'
          ? originalQuery(parameters)
        : Promise.resolve({ state: Notification.permission });

      const oldCall = Function.prototype.call;
      function call() {
        return oldCall.apply(this, arguments);
      }
      Function.prototype.call = call

      const nativeToStringFunctionString = Error.toString().replace(
        /Error/g,
        'toString',
      );
      const oldToString = Function.prototype.toString;

      function functionToString() {
        if (this === window.navigator.permissions.query) {
          return 'function query() { [native code] }';
        }
        if (this === functionToString) {
          return nativeToStringFunctionString;
        }
        return oldCall.call(oldToString, this);
      }
      Function.prototype.toString = functionToString
    });

    await page.goto('about:blank');

    const UA = await page.evaluate(() => window.navigator.userAgent);

     /* eslint-enable */
    await page.setUserAgent(UA);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
    });


    await browserContext.overridePermissions(page.url(), ['geolocation', 'midi', 'notifications', 'microphone', 'payment-handler']);

    if (_.isFinite(geolocation.latitude) && _.isFinite(geolocation.longitude)) {
      debugConsole(`setting-geolocation:${geolocation.latitude}:${geolocation.longitude}`);

      await page.setGeolocation({
        latitude: geolocation.latitude,
        longitude: geolocation.longitude,
      });
    }


    await page.setBypassCSP(true);
    await page.setViewport(DIMENSION);
    await page.setDefaultTimeout(150000);
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
    if (!captchaRequestBody.taskId) throw new Error(`taskId is not available: ${captchaRequestBody.errorDescription}`);

    for (;;) {
      // eslint-disable-next-line no-await-in-loop
      await wait(2000);

      let captchaResponseBody
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

  async resolveCaptcha(buffer) {
    try {
      if (!Buffer.isBuffer(buffer)) {
        return ((await this.resolveCaptchaTask({
          type: 'ImageToTextTask',
          body: buffer,
        })) || {}).text || '';
      }
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

  async dump(rootObj = {}) {
    return rootObj;
  }

  async init() {
    if (this.credential) {
      await this.importCredential(this.credential);
    } else if (this.chromeUserData) {
      this.parsedCredential = {
        chromeUserData: this.chromeUserData,
      };
    }

    if (this.messageRules && this.interaction) {
      this.interaction.messageRules = this.messageRules;
    }

    await this.startBrowser();
    await this.startHealthCheck();
  }

  async deinit() {
    try {
      await this.stopBrowser();
      await this.stopHealthCheck();
    } catch (error) {
      this.logger.error('deinit-error', {
        error,
      });
    }
  }

  async fetchURLCache(req) {
    this.logger.info('redis-url-cache-miss', { url: req.url });
    const response = await fetchURLResponse({ req, bot: this });

    const key = getURLCacheKey();
    const field = req.url;
    // prevent block
    redis.multi().hset(key, field, response).expire(key, 60 * 60 * 6).exec((error) => {
      if (error) this.logger.error('redis-url-cache-store-error', { error, url: req.url });
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
      this.logger.error('redis-url-cache-error', {
        error,
        url: req.url,
      });
      return JSON.parse(await this.fetchURLCache(req));
    }
  }


  idleCallbackCalled(id) {
    if (this.idleCallbackResolves[id]) {
      this.idleCallbackResolves[id].resolve();
      delete this.idleCallbackResolves[id];
    }
  }

  async waitForNavigation({
    timeout = 55000,
    contentLevel = PuppeteerBot.ContentLevel.MEANINGFUL,
  } = {}) {
    if (!Array.isArray(contentLevel) || contentLevel.length !== 2) throw new Error('unknown-content-level');
    const timeoutError = new Error(504, 'waitForNetworkIdle timeout');

    function checkLifecycle(frame, expectedLifecycle, expectedLifecycleForMain = []) {
      const lifecycles = expectedLifecycle.concat(expectedLifecycleForMain);
      // eslint-disable-next-line no-underscore-dangle
      debug('frame lifecycle:', Array.from(frame._lifecycleEvents).join(','), 'target:', lifecycles);
      for (let i = 0; i < lifecycles.length; i += 1) {
        // eslint-disable-next-line no-underscore-dangle
        if (!frame._lifecycleEvents.has(lifecycles[i])) return false;
      }
      const frames = frame.childFrames();
      for (let i = 0; i < frames.length; i += 1) {
        if (!checkLifecycle(frames[i], expectedLifecycle, [])) return false;
      }
      return true;
    }

    // eslint-disable-next-line no-underscore-dangle
    const initialLoaderId = this.page.mainFrame()._loaderId;

    let idleCount = 0;
    let doCheckLifecycle = false;
    for (const started = Date.now(); Date.now() - started < timeout;) {
      this.requestIds = this.requestIds.filter(r => Date.now() - r.at < timeout);

      debug('checkLifecycle start');
      const metLifecycle = checkLifecycle(this.page.mainFrame(), contentLevel[0], contentLevel[1]);
      debug('checkLifecycle end');
      // eslint-disable-next-line no-underscore-dangle
      if (!doCheckLifecycle && this.page.mainFrame()._loaderId !== initialLoaderId) {
        doCheckLifecycle = true;
      }

      if (doCheckLifecycle) {
        debug('waitForNavigation() checking lifecycle:', metLifecycle);
        if (metLifecycle) {
          return true;
        }
      } else {
        debug('waitForNavigation() pending requests:', this.requestIds.length);
        if (this.requestIds.length < 1) {
          idleCount += 1;
          if (idleCount > 30) {
            return true;
          }
        } else {
          idleCount = 0;
        }
      }

      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 100));
    }

    throw timeoutError;
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

  /**
   * Optional utilities to upload screenshots and page content to S3 and Google Cloud.
   */
  async captureToS3(name) {
    if (!s3) return null;
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
    if (!s3 && !this.botid) return null;
    try {
      await s3.upload({
        Body,
        Bucket: 'puppeteer-bots-dump',
        ContentType,
        Key: [process.env.NODE_ENV === 'production' ? 'prod' : 'dev', `${this.botId}/${filename}`].join('/'),
      }).promise();
    } catch (error) {
      this.logger.error('s3Upload', {
        error,
      });
    }
  }


  /**
   * Magic
   */
  async $$(selector, shouldIncludeInvisible = false) {
    const includeInvisible = !!shouldIncludeInvisible;
    if (!this.internal$$batches) this.internal$$batches = [];

    const promise = new Promise((resolve, reject) => this.internal$$batches.push({
      resolve, reject, selector, includeInvisible, key: `${selector}:${includeInvisible}`,
    }));

    setImmediate(() => {
      if (!this.internal$$batches) return;

      // copy batches and reset global
      const batches = this.internal$$batches;
      this.internal$$batches = undefined;

      // map batches
      const argKeyMap = batches
        .reduce((m, c) => Object.assign(m, { [c.key]: [...(m[c.key] || []), c] }), {});

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
                .reduce((m, c) => Object.assign(m, { [c.key]: c.result }), {})),
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
                this.logger('$$-resolve-error', { error: e });
              }
            });
          }));
        } catch (error) {
          this.logger('$$-aggregator-error', { error });
          // if error, all batches fails with same error
          batches.forEach((b) => {
            try {
              b.reject(error);
            } catch (e) {
              this.logger('$$-reject-error', { error: e });
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

      await this.page.evaluate(element => element.scrollIntoViewIfNeeded(), handle);
      await this.clickElementHandle(handle);
      await new Promise(r => setTimeout(r, opt.delayBeforeType || 65));
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
            delay: 20 + (Math.random() * (opt.delay || 10)),
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

  async selectByValue(opt) {
    const text = opt.replace(/'/g, '\', "\'", \'');
    const elementHandles = await this.page.$x((`//select[contains(text(), '${text}')]`));
    if (!elementHandles) return false;
    return this.clickElementHandle(elementHandles[0]);
  }

  async clickByLinkText(opt) {
    // eslint-disable-next-line quotes
    const text = opt.replace(/'/g, `', "'", '`);
    const elementHandles = await this.page.$x(`//a[contains(text(), '${text}')]`);
    if (!elementHandles) return false;
    return this.clickElementHandle(elementHandles[0]);
  }

  async clickByButtonText(opt) {
    const text = opt.replace(/'/g, '\', "\'", \'');
    const elementHandles = await this.page.$x(`//button[contains(text(), '${text}')]`);
    if (!elementHandles) return false;
    return this.clickElementHandle(elementHandles[0]);
  }

  async waitForNavigationOrSelector(selector, waitForNavOption = {
    waitUntil: 'networkIdle',
  }) {
    let resolved = false;
    try {
      console.time('waitForNavigationOrSelector');
      await Promise.race([
        this.page.waitForNavigation(waitForNavOption),
        // eslint-disable-next-line consistent-return
        (async () => {
          while (!resolved) {
            // eslint-disable-next-line no-await-in-loop
            if (await PuppeteerBot.puppeteerErrorRetry(async () => this.page.$(selector))) return `selector:${selector}`;
          }
        })(),
      ]);
      console.timeEnd('waitForNavigationOrSelector');
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
        this.logger.warn('clickElementHandle-empty-bounding-box', await this.dump({
          selector,
        }));
        return false;
      }

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
        await this.page.evaluate(element => element.scrollIntoViewIfNeeded(), handle);
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
          console.warn('click-target-covered', {
            result,
            x,
            y,
            width,
            height,
            targetX,
            targetY,
          });

          // eslint-disable-next-line no-await-in-loop
          await handle.click();
          return true;
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


  async startHealthCheck() {
    if (this.healthCheckTimeout) return;

    this.healthCheckStartedAt = Date.now();
    this.healthCheckTimeout = setTimeout(async () => {
      await this.healthCheckRepeater();
    }, 1000);
  }


  async healthCheckRepeater() {
    try {
      if (!await this.healthCheck()) {
        await this.stopBrowser();
      }
    } catch (error) {
      this.logger.error('health-check-repeater-error', await this.dump({ error }));
    } finally {
      if (this.browser && this.healthCheckTimeout) {
        this.healthCheckTimeout = setTimeout(async () => {
          await this.healthCheckRepeater();
        }, 1000);
      }
    }
  }

  async healthCheck() {
    this.healthCheckStartedAt = this.healthCheckStartedAt || Date.now();

    if (Date.now() - this.healthCheckStartedAt > this.browserTimeout) {
      this.logger.error('health-check-failed-browser-timeout', await this.dump());
      return false;
    }

    try {
      if (this.interaction && this.interaction.isUp) {
        if (!await this.interaction.checkValid()) {
          this.logger.error('health-check-failed-interaction-invalid', await this.dump());
          return false;
        }
      }
    } catch (error) {
      this.logger.warn('health-check-failed-interaction-validity-error', await this.dump({ error }));
      return false;
    }

    return true;
  }

  async stopHealthCheck() {
    if (!this.healthCheckTimeout) return;
    clearTimeout(this.healthCheckTimeout);
    this.healthCheckTimeout = undefined;
  }

  async startBrowser() {
    const geolocation = {};
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
      await this.loadUserData();
    }
    let parsedProxy = this.proxy ? url.parse(this.proxy) : null;

    if (this.proxy) {
      this.logger.debug(`active-proxy:${this.proxy}`);
      parsedProxy = url.parse(this.proxy);

      let publicIP;
      try {
        [, publicIP] = await rp({
          uri: 'https://api.ipify.org',
          proxy: parsedProxy,
        });
      } catch (error) {
        // ignore
      }
      const hostname = publicIP || (url.parse(parsedProxy) || {}).hostname;
      this.logger.info(`fingerprint-ip:${hostname}`);
      try {
        const maxmindResults = geoip.lookup(publicIP);
        // eslint-disable-next-line prefer-destructuring
        geolocation.latitude = maxmindResults.ll[0];
        // eslint-disable-next-line prefer-destructuring
        geolocation.longitude = maxmindResults.ll[1];

        const {
          region,
          city,
          range,
        } = maxmindResults;

        this.logger.info(`fingerprint-maxmind-geoip-latitude-${geolocation.latitude}`);
        this.logger.info(`fingerprint-maxmind-geoip-longitude-${geolocation.longitude}`);
        this.logger.info(`fingerprint-maxmind-geoip-city-${city}`);
        this.logger.info(`fingerprint-maxmind-geoip-region-${region}`);
        this.logger.info(`fingerprint-maxmind-geoip-range-${range}`);
      } catch (error) {
        this.logger.error(`maxmind-lookup-error-${error})`);
      }
    }

    const errorListener = (error) => {
      if (/Cannot find context with specified id undefined/.test(error.message)) return;
      if (/Session closed\. Most likely the page has been closed/.test(error.message)) return;
      if (/Protocol error \(Runtime\.callFunctionOn\): Target closed/.test(error.message)) return;
      if (/Session error \(Runtime\.callFunctionOn\): Message timed out/.test(error.message)) return;
      this.logger.error(`page-error-${Buffer.from(error.message).toString('base64')}`, {
        error,
      });
    };

    if (!this.browser) {
      const DISPLAY = this.preferNonHeadless ? process.env.XVFB_DISPLAY : process.env.DISPLAY;
      const args = ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--disk-cache-size=1', `--user-data-dir=${this.userDataDir}`, '--disable-infobars'];

      // support .onion
      if (this.tor) {
        args.push('--proxy-server=socks5://127.0.0.1:9150');
      }
      if (this.proxy) {
        args.push(parsedProxy ? `--proxy-server=${parsedProxy.host}` : '');
      }

      const options = {
        ignoreHTTPSErrors: true,
        headless: !this.preferNonHeadless,
        env: Object.assign({ DISPLAY }, process.env),
        args,
      };

      if (this.executablePath) options.executablePath = this.executablePath;
      if (this.browserless) {
        this.browser = await puppeteer.connect({
          browserWSEndpoint: `wss://chrome.browserless.io/?token=${process.env.BROWSERLESS_KEY}`,
        });
      } else {
        this.browser = await puppeteer.launch(options);
      }

      const version = await this.browser.version();
      this.logger.info(`puppeteer-current-chromium-revision:${version}`);

      this.browser.on('error', errorListener);
      // eslint-disable-next-line no-return-assign
      this.browser.on('disconnected', () => this.browser = null);
      this.browserContext = this.browser.defaultBrowserContext();
    }

    if (!this.page) {
      this.page = await this.browser.newPage();

      this.incompleteRequests = [];

      await PuppeteerBot.disguisePage(this.page, this.browserContext, {
        browserUniqueID: this.botId,
        logger: this.logger,
        minWidth: this.minWidth,
        minHeight: this.minHeight,
        options: this.disguiseOptions,
        disguiseFlags: this.disguiseFlags,
        emulateFlag: this.emulateFlag,
        geolocation,
      });

      this.idleCallbackName = uuid().replace(/-/g, '');
      await this.page.exposeFunction(this.idleCallbackName, (id) => {
        this.idleCallbackCalled(id);
      });

      // before load cookie, check cookie
      await this.loadCookies();

      if (parsedProxy && parsedProxy.auth) {
        const auth = parsedProxy.auth.split(':');
        await this.page.authenticate({
          username: auth[0],
          password: auth[1],
        });
      }

      this.page.on('error', errorListener);
      this.page.on('close', () => {
        this.page = null;
      });

      this.page.on('requestfailed', (interceptedReq) => {
        this.requestIds = this.requestIds.filter(r => r.id !== interceptedReq.id);
        const rurl = interceptedReq.url();
        if (this.incompleteRequests) {
          // eslint-disable-next-line no-underscore-dangle
          this.incompleteRequests = this.incompleteRequests.filter(r => r !== interceptedReq);
        }
        // eslint-disable-next-line no-underscore-dangle
        if (/net::ERR_ABORTED/.test(interceptedReq._failureText) || /net::ERR_CONNECTION_CLOSED/.test(interceptedReq._failureText) || /net::ERR_CONNECTION_REFUSED/.test(interceptedReq._failureText)) return;

        // parse host only
        let host = '';
        try {
          const parsed = url.parse(rurl);
          if (parsed.hostname) {
            host = `-${parsed.hostname}`;
          }
        } catch (error) {
          // ignore
        }

        // eslint-disable-next-line no-underscore-dangle
        this.logger.error(`request-failed-${interceptedReq._failureText}-${host}`, { skipList: true });
      });

      this.page.on('requestfinished', (interceptedReq) => {
        this.requestIds = this.requestIds.filter(r => r.id !== interceptedReq.id);
        if (this.incompleteRequests) {
          // eslint-disable-next-line no-underscore-dangle
          this.incompleteRequests = this.incompleteRequests.filter(r => r !== interceptedReq);
        }
      });

      this.page.on('request', async (interceptedReq) => {
        if (!this.enableRequestInterception) {
          // Prevent throwing an error if enableRequestInterception is false
          // eslint-disable-next-line no-param-reassign
          interceptedReq.continue = () => {};
          // eslint-disable-next-line no-param-reassign
          interceptedReq.abort = () => {};
        }

        if (this.interceptRequest && this.interceptRequest(interceptedReq)) return null;

        const rurl = this.requestURLReplacer(interceptedReq);
        if (!rurl) return interceptedReq.abort();

        if (this.requestSoftAbortRules.find(r => r.test(rurl)) !== undefined) return interceptedReq.abort('aborted');

        this.requestIds = this.requestIds.filter(r => r.id !== interceptedReq.id);
        this.requestIds.push({
          id: this.requestIds.id,
          at: Date.now(),
        });

        if (this.incompleteRequests) {
          // eslint-disable-next-line no-underscore-dangle
          this.incompleteRequests.push(interceptedReq);
        }

        if (!/^http[s]?:/i.test(rurl)) {
          return interceptedReq.continue();
        }

        if (this.requestHardAbortRules.find(regex => interceptedReq.url().match(regex))) {
          return interceptedReq.abort();
        }

        if (interceptedReq.redirectChain().length > 0) {
          return interceptedReq.continue();
        }

        if ((interceptedReq.method() || '').toLowerCase() !== 'get') {
          return interceptedReq.continue();
        }

        try {
          // eslint-disable-next-line max-len
          if (this.trustChromeNativeRequest || !this.enableRequestInterception) return interceptedReq.continue({ url: rurl });

          if ((!this.urlCacheSkipRules || !this.urlCacheSkipRules.find(r => r.test(rurl))) && /^http[s]?:\/\/(.*)\/.+\.(js|css|woff|woff2|png|jpg|gif|bmp|ico)(\?.*)?$/i.test(rurl)) {
            return interceptedReq.respond(await this.getURLCache({
              url: rurl,
              headers: interceptedReq.headers(),
            }));
          }

          return interceptedReq.respond(await fetchURLResponse({
            req: { url: rurl, headers: interceptedReq.headers() },
            bot: this,
            proxy: this.proxy,
            raw: true,
          }));
        } catch (error) {
          return interceptedReq.continue();
        }
      });
    }
  }

  async newPage(disguise = true) {
    const page = await this.browser.newPage();
    if (disguise) return page;
    return PuppeteerBot.disguisePage(page, {
      browserUniqueID: this.botId,
      logger: this.logger,
      minWidth: this.minWidth,
      minHeight: this.minHeight,
      emulateFlag: this.emulateFlag,
      disguiseFlags: this.disguiseFlags,
    });
  }

  async stopBrowser() {
    try {
      if (this.page) {
        await this.page.close();
      }
    } catch (error) {
      this.logger.error('failed-page-close', await this.dump({ error }));
    } finally {
      this.page = null;
    }

    try {
      if (this.browser && this.browser.isConnected()) {
        await this.browser.close();
      }
    } catch (error) {
      this.logger.error('failed-browser-close', await this.dump({ error }));
    } finally {
      this.browser = null;
    }

    if (this.cleanUps) {
      for (let i = 0; i < this.cleanUps.length; i += 1) {
        try {
          this.cleanUps[i]();
        } catch (error) {
          // eslint-disable-next-line no-await-in-loop
          this.logger.error('failed-call-cleanUp', await this.dump({ error }));
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
    await this.loadUserData();
  }

  async getRequestCookieJar() {
    const jar = request.jar();

    // eslint-disable-next-line no-underscore-dangle
    jar._jar = toughCookie.CookieJar.fromJSON({
      looseMode: true,
      // eslint-disable-next-line no-underscore-dangle
      cookies: (await this.page._client.send('Network.getAllCookies')).cookies.map(c => ({
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

  async loadCookies() {
    if (!this.parsedCredential || !this.parsedCredential.cookies || !this.page) return;

    if (this.parsedCredential.puppeteerCookies) {
      await this.page.setCookie(...this.parsedCredential.puppeteerCookies);
    } else {
      await Promise.all(this.parsedCredential.cookies.map(async (c) => {
        const expires = parseInt(Date.parse(c.expires) / 1000, 10);
        if (_.isNaN(expires) || !_.isFinite(expires)) {
          this.logger.warn('expires-nan', await this.dump({ cookies: this.parsedCredential.cookies }));
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
        } catch (error) {
          this.logger.error('failed-setting-cookie', await this.dump({ cookie }));
        }
      }));
    }
  }

  async loadUserData() {
    if (!this.parsedCredential || !this.parsedCredential.chromeUserData
      || !this.userDataDir || this.parsedCredential.chromeUserData.length < 1) return;

    const stream = await tar.x({
      cwd: this.userDataDir,
      gzip: true,
    });
    stream.end(Buffer.isBuffer(this.parsedCredential.chromeUserData) ? this.parsedCredential.chromeUserData : Buffer.from(this.parsedCredential.chromeUserData, 'base64'));
  }

  async getChromeUserData() {
    assert(this.userDataDir, 'userDataDir is empty');

    try {
      const buf = await streamToBuffer(await tar.c({
        gzip: true,
        cwd: this.userDataDir,
        filter(path) {
          if (/BrowserMetrics-active\.pma$/i.test(path)) return false;
          if (/\/Favicons(-journal)?$/.test(path)) return false;
          if (/\/History(-journal)?$/.test(path)) return false;
          if (/\/Top Sites(-journal)?$/.test(path)) return false;
          if (/\/Last Session$/.test(path)) return false;
          if (/\/Last Tabs$/.test(path)) return false;
          if (/\/Visited Links$/.test(path)) return false;
          if (/\/ShaderCache\//.test(path)) return false;
          if (/\/ShaderCache$/.test(path)) return false;
          if (/\/GPUCache\//.test(path)) return false;
          if (/\/GPUCache$/.test(path)) return false;
          return true;
        },
      }, ['.']));

      return buf;
    } catch (error) {
      this.logger.error('error-getChromeUserData', {
        error,
      });
      return Buffer.from('');
    }
  }

  async exportCredential() {
    assert(this.page, 'page is empty');

    // eslint-disable-next-line no-underscore-dangle
    const {
      cookies,
    // eslint-disable-next-line no-underscore-dangle
    } = (await this.page._client.send('Network.getAllCookies'));

    return new Promise(async (resolve, reject) => {
      try {
        return zlib.gzip(JSON.stringify({
          chromeUserData: (await this.getChromeUserData()).toString('base64'),
          puppeteerCookies: cookies,
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


PuppeteerBot.ContentLevel = {
  CONTENTFUL: [
    [],
    ['firstContentfulPaint'],
  ],
  SKELETON: [
    [],
    ['DOMContentLoaded'],
  ],
  MEANINGFUL: [
    [],
    ['firstMeaningfulPaint'],
  ],
  FULL: [
    ['load', 'networkidle'],
    [],
  ],
};

PuppeteerBot.fetchURLResponse = fetchURLResponse;
PuppeteerBot.puppeteerErrorRetry = puppeteerErrorRetry;
module.exports = PuppeteerBot;
