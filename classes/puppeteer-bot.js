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
const debugConsole = require('debug')('puppeteer-bot:console');
const debug = require('debug')('puppeteer-bot');
const _ = require('lodash');
const shortid = require('shortid');
const UserAgent = require('user-agents');
const geoip = require('geoip-lite');

const redis = new Redis(process.env.LOCAL_REDIS_URI || undefined);

const rp = opt => new Promise((resolve, reject) => request(opt, (err, resp, body) => {
  if (err) return reject(err);
  return resolve([resp, body]);
}));

const wait = ms => new Promise(r => setTimeout(r, ms));

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

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const buffers = [];
    stream.on('error', reject);
    stream.on('data', data => buffers.push(data));
    stream.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

function getGeo(latitude = 34.0224, longitude = 118.4768, radiusInMeters) {
  const getRandomCoordinates = (radius, uniform) => {
    let a = Math.random();
    let b = Math.random();
    if (uniform) {
      if (b < a) {
        const c = b;
        b = a;
        a = c;
      }
    }
    return [
      b * radius * Math.cos(2 * Math.PI * a / b),
      b * radius * Math.sin(2 * Math.PI * a / b),
    ];
  };

  const randomCoordinates = getRandomCoordinates(radiusInMeters, true);
  const earth = 6378137;

  const northOffset = randomCoordinates[0];
  const eastOffset = randomCoordinates[1];

  const offsetLatitude = northOffset / earth;
  const offsetLongitude = eastOffset / (earth * Math.cos(Math.PI * (latitude / 180)));

  return {
    latitude: latitude + (offsetLatitude * (180 / Math.PI)),
    longitude: longitude + (offsetLongitude * (180 / Math.PI)),
  };
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

  redis.multi().set(`puppeteer-bot-2a:fingerprint:${emulateFlag}`, JSON.stringify(fingerprint)).exec((error) => { });
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
    userId,
    proxy,
    credential,
    chromeUserData,
    label = 'puppeteer-bot',
    interaction,
    browserTimeout = 45 * 60 * 1000,
    minWidth = 1024,
    minHeight = 1080,
    anonymizeReferer = false,
    trustChromeNativeRequest = false,
    preferNonHeadless = false,
    disguiseFlags = [],
    emulateFlag = 'desktop',
    enableRequestInterception = true,
  } = {}) {
    this.interaction = interaction;
    this.userId = userId || shortid.generate();
    this.proxy = proxy;
    this.credential = credential;
    this.chromeUserData = chromeUserData;

    this.cleanUps = [];
    this.requestIds = [];

    this.label = label;

    this.healthCheckTimeout = undefined;
    this.browserTimeout = browserTimeout;

    this.browserUniqueID = this.userId;

    this.minWidth = minWidth;
    this.minHeight = minHeight;

    this.anonymizeReferer = anonymizeReferer;
    this.trustChromeNativeRequest = trustChromeNativeRequest;

    this.preferNonHeadless = preferNonHeadless;
    this.disguiseFlags = disguiseFlags;
    this.emulateFlag = emulateFlag;

    this.enableRequestInterception = enableRequestInterception;
  }

  /**
   *
   * @description
   * @static
   * @param {*} page
   * @param {*} [{
   *     browserUniqueID,
   *     logger,
   *     minWidth = 1280,
   *     minHeight = 1024,
   *     disguiseFlags = [],
   *     emulateFlag = 'desktop',
   *   }={}]
   * @memberof PuppeteerBot
   */
  static async disguisePage(page, {
    browserUniqueID,
    logger,
    minWidth = 1280,
    minHeight = 1024,
    disguiseFlags = [],
    emulateFlag = 'desktop',
  } = {}) {
    const fingerprint = getBrowserfingerprint(browserUniqueID, emulateFlag);

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
      await page.on('pageerror', err => debug('PAGE ERR:', err));
    }

    const DIMENSION = {
      isLandscape: true,
      width: minWidth > fingerprint.viewportWidth ? minWidth : (parseInt(minWidth + (fingerprint.random(0)
        * (fingerprint.screenWidth - minWidth)), 10)),
      height: minHeight > fingerprint.viewportHeight ? minHeight : (parseInt(minHeight + (fingerprint.random(1)
        * (fingerprint.screenHeight - minHeight)), 10)),
    };

    /* eslint-disable */
    await page.evaluateOnNewDocument(async (fingerprint, LO, D, flags) => {
      const F = new Set(flags);

      const logOverride = (key, value) => {
        if (!LO) return value;
        // eslint-disable-next-line no-console
        console.log(`Overriden: ${key}=${value}`);
        return value;
      };

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
            extensions: 'pdf',
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

      const chrome = {
        app: {
          isInstalled: false,
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
      window.navigator.__defineGetter__('webdriver', () => logOverride('webdriver', undefined));
      window.navigator.__defineGetter__('plugins', () => logOverride('plugins', plugins));
      window.navigator.__defineGetter__('languages', () => logOverride('languages', ['en-US,en']));
      window.navigator.__defineGetter__('chrome', () => logOverride('chrome', chrome));

      // reject webRTC fingerprinting
      window.__defineGetter__('MediaStreamTrack', () => logOverride('MediaStreamTrack', undefined));
      window.__defineGetter__('RTCPeerConnection', () => logOverride('RTCPeerConnection', undefined));
      window.__defineGetter__('RTCSessionDescription', () => logOverride('RTCSessionDescription', undefined));
      window.__defineGetter__('webkitMediaStreamTrack', () => logOverride('webkitMediaStreamTrack', undefined));
      window.__defineGetter__('webkitRTCPeerConnection', () => logOverride('webkitRTCPeerConnection', undefined));
      window.__defineGetter__('webkitRTCSessionDescription', () => logOverride('webkitRTCSessionDescription', undefined));

      // this will pass canvas detection
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

      hookPrototypeMethods('screen', window.screen);
      hookPrototypeMethods('navigator', window.navigator);
      hookPrototypeMethods('history', window.history);

      // Pass the Permissions Test.
      const originalQuery = window.navigator.permissions.query;
      return window.navigator.permissions.query = (parameters) => ( parameters.name === 'notifications' ? Promise.resolve({ state: Notification.permission }) : originalQuery(parameters)
  );

    }, fingerprint, LOG_OVERRIDE, DIMENSION, disguiseFlags);
    /* eslint-enable */

    await page.goto('about:blank');

    // eslint-disable-next-line no-undef
    const UA = await page.evaluate(() => window.navigator.userAgent);
    await page.setUserAgent(UA);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
    });

    await page.setViewport(DIMENSION);
    await page.setDefaultTimeout(120000);
  }



  /**
   * @description: Resolves a CaptchaTask using supported provider AntiCaptcha
   * @param {*} task
   * @returns
   * @memberof PuppeteerBot
   */
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
    if (!captchaRequestBody.taskId) throw new Error(500, `taskId is not available: ${captchaRequestBody.errorDescription}`);

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


  /**
   * @description: Solves captcha and retuns solution (Only ImageToText)
   * @param {*} buffer
   * @returns
   * @memberof PuppeteerBot
   */
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
      console.error('failed-resolve-captcha', await this.dump({
        error,
        buffer: buffer.toString('base64'),
      }));
      throw error;
    }
  }

  async uploadBlob(file, contentType, buffer) {
    const container = 'puppeteer-bot-2-dump';
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


  /**
   * @description: dumps active html browser content and screenshot to Azure storage blob service.
   * @param {*} [rootObj={}]
   * @returns
   * @memberof PuppeteerBot
   */
  async dump(rootObj = {}) {
      try {
          if (this.page) {
              const blobUrlContent = await this.uploadBlob(
                  `content/${uuid()}-${Date.now()}.html`,
                  'text/html',
                  Buffer.from(await puppeteerErrorRetry(async() => this.page.content())),
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
                  await puppeteerErrorRetry(async() => this.page.screenshot()),
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



  /**
   * @description: initializes the puppeteer bot & imports chrome user data, cookies, etc if specified
   * @memberof PuppeteerBot
   */
  async init() {
    if (this.credential) {
      await this.importCredential(this.credential);
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
      console.error('deinit-error', { error });
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
    const timeoutError = new rror(504, 'waitForNetworkIdle timeout');

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


  /**
   * @description: For given selector attempt to check the corresponding element - as in a checkbox.
   * @param {*} query
   * @param {boolean} [value=true]
   * @returns
   * @memberof PuppeteerBot
   */
  async check(query, value = true) {
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


  /**
   * @description: Checks if ElementHandle has been checked properly
   * @param {*} handle
   * @param {boolean} [value=true]
   * @returns
   * @memberof PuppeteerBot
   */
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
   * @description: Critical function that gets all visible element handles on the DOM for a given CSS selector.
   * @param {*} selector
   * @param {boolean} [shouldIncludeInvisible=false]
   * @returns
   * @memberof PuppeteerBot
   */
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
                console.error('$$-resolve-error');
              }
            });
          }));
        } catch (error) {
          console.error('$$-aggregator-error');
          // if error, all batches fails with same error
          batches.forEach((b) => {
            try {
              b.reject(error);
            } catch (e) {
              console.error('$$-reject-error');
            }
          });
        }
      })();
    });

    return promise;
  }



  /**
   * @description
   * @param {*} q: CSS selector
   * @param {*} opt: value to fill
   * @returns
   * @memberof PuppeteerBot
   */
  async fill(q, opt) {
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


  /**
   * @description: checks ElementHandle to verify if filled correctly
   * @param {*} handle
   * @param {*} opt
   * @returns
   * @memberof PuppeteerBot
   */
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


  /**
   * @description: peforms a dirty select on item inside drop-down list
   * @param {*} q
   * @param {*} opt
   * @returns
   * @memberof PuppeteerBot
   */
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


  /**
   * @description: will scroll into view safely, hover, hestitate for a ranodm delay, and invoke class member clickElementHandle()
   * @param {*} handle
   * @param {*} opt
   * @returns
   * @memberof PuppeteerBot
   */
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


  async click(selector) {
    const elementHandles = await this.page.$$(selector);
    let result = false;
    for (let i = 0; i < elementHandles.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      result = await this.clickElementHandle(elementHandles[i]) || result;
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


  /**
   * @description:
   * scrollIntoViewIfNeeded(), evaluate boundingBox
   * [calculate randomized offset from center coordinates of element].[move mouse with randomized step between ms movements] to designated coordinates
   * [click using randomized behavioral context]
   * @param {*} handle
   * @memberof PuppeteerBot
   */
  async clickElementHandle(handle) {
    return puppeteerErrorRetry(async () => {
      if (!handle) {
        console.error('clickElementHandle-empty-handle');
        return false;
      }

      await this.page.evaluate(element => element.scrollIntoViewIfNeeded(), handle);
      const boundingBox = await handle.boundingBox();
      if (!boundingBox) {
        return false;
      }

      if (!await this.page.evaluate(isVisible, handle)) {
        this.logger.warn('clickElementHandle-invisible-handle');
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
        // eslint-disable-next-line no-await-in-loop
        await this.page.evaluate(e => e.scrollIntoView({
          behavior: 'instant',
          block: 'center',
          inline: 'center',
        }), handle);

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
      console.error('health-check-repeater-error');
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
      console.error('health-check-failed-browser-timeout');
      return false;
    }

    try {
      if (this.interaction && this.interaction.isUp) {
        if (!await this.interaction.checkValid()) {
          console.error('health-check-failed-interaction-invalid');
          return false;
        }
      }
    } catch (error) {
      this.logger.warn('health-check-failed-interaction-validity-error');
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

    let geo = getGeo();
    let parsedProxy = null;

    if (this.proxy) {
      this.logger.debug(`active proxy: ${this.proxy}`);
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
      this.logger.info(`fingerprint-ip-${hostname}`);
      try {
        geo = geoip.lookup(publicIP);
        this.logger.info(`fingerprint-maxmind-geoip-${geo.ll}`);
      } catch (error) {
        // ignore
      }
    }

    const errorListener = (error) => {
      if (/Cannot find context with specified id undefined/.test(error.message)) return;
      if (/Session closed\. Most likely the page has been closed/.test(error.message)) return;
      if (/Protocol error \(Runtime\.callFunctionOn\): Target closed/.test(error.message)) return;
      if (/Session error \(Runtime\.callFunctionOn\): Message timed out/.test(error.message)) return;
      console.error(`page-error-${Buffer.from(error.message).toString('base64')}`, {
        error,
      });
    };

    if (!this.browser) {
      const DISPLAY = this.preferNonHeadless ? process.env.XVFB_DISPLAY : process.env.DISPLAY;
      const options = {
        ignoreHTTPSErrors: true,
        headless: !this.preferNonHeadless,
        ignoreDefaultArgs: ['--enable-automation'],
        env: Object.assign({
          DISPLAY,
        }, process.env),
        args: [
          '--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--ignore-certificate-errors-spki-list',
          '--disk-cache-size=1', `--user-data-dir=${this.userDataDir}`, '--disable-infobars', '--enable-features=NetworkService',
          parsedProxy ? `--proxy-server=${parsedProxy.host}` : '',
        ],
      };
      this.browser = await puppeteer.launch(options);

      this.browser.on('error', errorListener);
      this.browser.on('disconnected', () => {
        this.browser = null;
      });
    }

    if (!this.page) {
      this.page = await this.browser.newPage();

      const { address } = ([].concat(...Object.values(os.networkInterfaces())).filter(i => i.family === 'IPv4' && !i.internal)[0] || {});
      // eslint-disable-next-line no-underscore-dangle
      const { port } = url.parse(this.browser._connection.url());
      // eslint-disable-next-line no-underscore-dangle
      const targetId = this.page._client._targetId;

      console.log('puppeteer-bot:ChromeDevToolAvailable', {
        ws: `${address}:${port}/devtools/page/${targetId}`,
        userId: this.userId,
        bypassRateLimit: true,
      });

      this.incompleteRequests = [];

      await PuppeteerBot.disguisePage(this.page, {
        browserUniqueID: this.userId,
        logger: this.logger,
        minWidth: this.minWidth,
        minHeight: this.minHeight,
        options: this.disguiseOptions,
        disguiseFlags: this.disguiseFlags,
        emulateFlag: this.emulateFlag,
      });

      this.idleCallbackName = uuid().replace(/-/g, '');
      await this.page.exposeFunction(this.idleCallbackName, (id) => {
        this.idleCallbackCalled(id);
      });

      await this.loadCookies();

      if (parsedProxy && parsedProxy.auth) {
        const auth = parsedProxy.auth.split(':');
        await this.page.authenticate({
          username: auth[0],
          password: auth[1],
        });
      }

      if (this.proxy && _.isFinite(geo.ll[0]) && _.isFinite(geo.ll[1])) {
        const context = this.browser.defaultBrowserContext();
        await context.overridePermissions(this.page.url(), ['geolocation']);
        await this.page.setGeolocation({ latitude: geo.ll[0], longitude: geo.ll[1] });
      }

      await this.page.setRequestInterception(this.enableRequestInterception);

      this.page.on('error', errorListener);
      this.page.on('close', () => {
        this.page = null;
      });
    }
  }

  async newPage() {
    const page = await this.browser.newPage();
  }


  async stopBrowser() {
    if (this.page) {
        await this.page.close();
    }

    if (this.browser) {
        await this.browser.close();
    }

    if (this.cleanUps) {
      for (let i = 0; i < this.cleanUps.length; i += 1) {
        try {
          this.cleanUps[i]();
        } catch (error) {
          // eslint-disable-next-line no-await-in-loop
          console.error('failed-call-cleanUp', { error });
        } finally {
          this.cleanUps.splice(i, 1);
        }
      }
      this.cleanUps = [];
      this.userDataDir = null;
    }
  }

  /**
   * @description: Imports a credential: establishes exact copy of prior file structure/chrome executable, sets cookies.
   * @param {*} zbuf
   * @memberof PuppeteerBot
   */
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

  /**
   * @description: Returns a cookie jar
   * @param {*}
   * @memberof PuppeteerBot
   */
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



  /**
   * @description: loads cookies (all- both default and puppeteer-cookies)
   * @returns
   * @memberof PuppeteerBot
   */
  async loadCookies() {
    if (!this.parsedCredential || !this.parsedCredential.cookies || !this.page) return;

    if (this.parsedCredential.puppeteerCookies) {
      await this.page.setCookie(...this.parsedCredential.puppeteerCookies);
    } else {
      await Promise.all(this.parsedCredential.cookies.map(async (c) => {
        const expires = parseInt(Date.parse(c.expires) / 1000, 10);
        if (_.isNaN(expires) || !_.isFinite(expires)) {
          this.logger.warn('expires-nan', { cookies: this.parsedCredential.cookies });
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
          console.error('failed-setting-cookie', await this.dump({ cookie }));
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



  /**
   * @description: Converts location where chromium is executing and files contained therein to a buffer. Used inside importCredential() for details.
   * @returns string
   * @memberof PuppeteerBot
   */
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
      console.error('error-getChromeUserData', { error });
      return Buffer.from('');
    }
  }


  /**
   * @description: Exports a string (base-64 encoded) containing all cookies and chromium prefs/file structure.
   * @returns
   * @memberof PuppeteerBot
   */
  async exportCredential() {
    assert(this.page, 'page is empty');

    // eslint-disable-next-line no-underscore-dangle
    const { cookies } = (await this.page._client.send('Network.getAllCookies'));

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
