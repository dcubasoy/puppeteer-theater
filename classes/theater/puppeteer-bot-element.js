const assert = require('assert');
const tmp = require('tmp');
const fs = require('fs');
const util = require('util');
const _ = require('lodash');
const tabletojson = require('tabletojson');

const fsWrite = util.promisify(fs.write);
const fsClose = util.promisify(fs.close);

class PuppeteerBotElement {
  constructor({
    scene, show, elementHandle, query = {},
  }) {
    this.scene = scene;
    this.query = query;
    if (!this.query.visibility) this.query.visibility = 'required';
    assert(/^(required$|optional$|required:|forbidden$)/.test(this.query.visibility), `unsupported visibility ${this.query.visibility}`);
    this.show = show;
    this.elementHandle = elementHandle;
  }

  async visibleElementHandles() {
    let visibleElements = [];

    if (this.elementHandle) visibleElements = [this.elementHandle];
    else {
      try {
        visibleElements = await (await this.show.bot()).$$(this.query.selector, this.query.includeInvisible);
      } catch (error) {
        // ignore error
      }
    }

    if (this.query.visibilityAreaCheck) {
      visibleElements = (await Promise.all(visibleElements.map(async (e) => {
        const box = await e.boundingBox();
        if (!box) return null;
        if (box.width < 2 || box.height < 2) return null;
        return e;
      }))).filter(e => !!e);
    }
    if (this.query.match) {
      visibleElements = (await Promise.all(visibleElements.map(async (e) => {
        const args = this.query.matchArguments && await this.query.matchArguments();

        if (await (await this.show.bot()).page.evaluate(this.query.match, e, args)) {
          return e;
        }
        return null;
      }))).filter(e => !!e);
    }

    return visibleElements;
  }

  async visibleElements() {
    const handles = await this.visibleElementHandles();

    return handles.map(e => new PuppeteerBotElement({
      scene: this.scene,
      show: this.show,
      elementHandle: e,
    }));
  }

  async visible() {
    return (await this.visibleElementHandles()).length > 0;
  }

  async getFrame() {
    const els = await this.visibleElementHandles();
    return els[0].contentFrame();
  }

  async select(...value) {
    return (await this.show.bot()).page.select(this.query.selector, ...value);
  }

  async $select(opt) {
    if (!opt) {
      this.scene.log('Element:', this.query.selector, 'select-empty');
      return true;
    }
    this.scene.log('Element:', this.query.selector, 'select', 'fetchingElements');
    const elements = await this.visibleElementHandles();
    this.scene.log('Element:', this.query.selector, 'select', 'elementsFetched:', elements.length);

    await elements[0].click();
    await (await this.show.bot()).page.keyboard.type(opt, { delay: 50 });
    await (await this.show.bot()).page.keyboard.press('Enter');

    this.scene.log('Element:', this.query.selector, 'select', '$selected');
  }


  async upload(file, opt = {}) {
    const { path, fd, cleanupCallback } = await new Promise((resolve, reject) => tmp.file(Object.assign({
      prefix: 'file-',
    }, opt), (err, p, f, c) => {
      if (err) return reject(err);
      return resolve({ path: p, fd: f, cleanupCallback: c });
    }));

    try {
      await fsWrite(fd, file);
      await fsClose(fd);

      const els = await this.visibleElementHandles();
      for (let i = 0; i < els.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await (await this.show.bot()).page.setRequestInterception(false);
        // eslint-disable-next-line no-await-in-loop
        await els[i].uploadFile(path);
        // eslint-disable-next-line no-await-in-loop
        await (await this.show.bot()).page.setRequestInterception(true);
      }
      return els.length > 0;
    } catch (error) {
      this.scene.log('upload error', error);
      return false;
    } finally {
      cleanupCallback();
    }
  }

  async match(matchContext) {
    if (this.query.visibility === 'optional') return true;
    if (/^required:/.test(this.query.visibility)) {
      Object.assign(matchContext, {
        [this.query.visibility]: await this.visible() || matchContext[this.query.visibility],
      });
      return true;
    }
    // eslint-disable-next-line no-bitwise
    return ((await this.visible()) ^ (this.query.visibility === 'required')) === 0;
  }

  async tableContent() {
    const els = await this.visibleElementHandles();
    const strs = await Promise.all(els.map(async el => (await this.show.bot()).page.evaluate(e => ((e || {}).outerHTML || '').trim(), el)));
    const content = strs.filter(s => !!s).join('\n');
    return tabletojson.convert(content, { stripHtml: true, stripHtmlFromHeadings: true, stripHtmlFromCells: true });
  }

  async textContent({ asArray = false } = {}) {
    const els = await this.visibleElementHandles();
    const strs = await Promise.all(els.map(async el => (await this.show.bot()).page.evaluate(e => ((e || {}).textContent || '').trim(), el)));
    if (asArray) {
      return strs;
    }
    return strs.filter(s => !!s).join('\n');
  }

  async textContents() {
    return this.textContent({ asArray: true });
  }

  async innerText({ asArray = false } = {}) {
    const els = await this.visibleElementHandles();
    const strs = await Promise.all(els.map(async el => (await this.show.bot()).page.evaluate(e => ((e || {}).innerText || '').trim(), el)));
    if (asArray) {
      return strs;
    }
    return strs.filter(s => !!s).join('\n');
  }

  async innerTexts() {
    return this.innerText({ asArray: true });
  }

  async fill(opt) {
    if (!opt) {
      this.scene.log('Element:', this.query.selector, 'fill-empty');
      return true;
    }
    this.scene.log('Element:', this.query.selector, 'fill', 'fetchingElements');
    const elements = await this.visibleElementHandles();
    this.scene.log('Element:', this.query.selector, 'fill', 'elementsFetched:', elements.length);
    let worked = false;
    for (let i = 0; i < elements.length; i += 1) {
      this.scene.log('Element:', this.query.selector, 'fill', 'index:', i);

      // eslint-disable-next-line no-await-in-loop
      worked = await (await this.show.bot()).fillElementHandle(elements[i], opt) || worked;
      this.scene.log('Element:', this.query.selector, 'fill', 'filled', worked);
    }
    return worked;
  }


  async check(checked) {
    this.scene.log('Element:', this.query.selector, 'check');
    const elements = await this.visibleElementHandles();
    let worked = null;
    for (let i = 0; i < elements.length; i += 1) {
      this.scene.log('Element:', this.query.selector, 'check', 'i:', i);
      // eslint-disable-next-line no-await-in-loop
      const result = await (await this.show.bot()).checkElementHandle(elements[i], checked);
      if (result !== null) worked = result || worked || false;
    }
    return worked;
  }

  async checked() {
    const els = await this.visibleElementHandles();
    const strs = await Promise.all(els.map(
      async el => (await this.show.bot()).page.evaluate(e => !!(e || {}).checked, el),
    ));
    return strs.filter(s => !!s).length === strs.length;
  }

  async click({ once = false } = {}) {
    this.scene.log('Element:', this.query.selector, 'click');
    const elements = await this.visibleElementHandles();
    let worked = false;
    let error;
    for (let i = 0; i < elements.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      this.scene.log('Element:', this.query.selector, 'click', 'i:', i, ', html:', await (await elements[i].getProperty('outerHTML')).jsonValue());
      try {
        // eslint-disable-next-line no-await-in-loop
        worked = await (await this.show.bot()).clickElementHandle(elements[i]) || worked;
      } catch (e) {
        error = e;
      }
      if (worked && once) break;
    }

    if (worked) return worked;
    if (error) throw error;
    return worked;
  }

  async value() {
    const els = await this.visibleElementHandles();
    const strs = await Promise.all(els.map(async el => (await this.show.bot()).page.evaluate(e => ((e || {}).value || '').trim(), el)));
    return strs.filter(s => !!s)[0] || (els.length > 0 ? '' : undefined);
  }

  async values() {
    const els = await this.visibleElementHandles();
    const strs = await Promise.all(els.map(async el => (await this.show.bot()).page.evaluate(e => ((e || {}).value || '').trim(), el)));
    return strs;
  }

  async attribute(opt) {
    const els = await this.visibleElementHandles();
    const attrs = await Promise.all(els.map(async el => (await this.show.bot()).page.evaluate(e => e.getAttribute(opt), el)));
    return attrs.filter(s => !!s)[0] || (els.length > 0 ? '' : undefined);
  }


  async screenshot() {
    const els = await this.visibleElementHandles();
    return els[0].screenshot({ encoding: 'base64' });
  }

  async eval(func, ...args) {
    return (await this.show.bot()).$$safeEval(this.query.selector, func, ...args);
  }
}

module.exports = PuppeteerBotElement;
