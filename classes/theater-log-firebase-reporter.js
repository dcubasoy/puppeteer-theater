const assert = require('assert');
const util = require('util');
const shortid = require('shortid');
const { Storage } = require('@google-cloud/storage');
const createLogger = require('../utils/logger');

const Show = require('./theater/show');

const gcs = new Storage();

class TheaterLogFirebaseReporter {
  constructor({
    show,
    bot,
    userId,
    bucket = `${process.env.S3_BUCKET_PREFIX}-theater-logs`,
    // eslint-disable-next-line no-shadow
    logger,
  }) {
    assert(show instanceof Show, 'emitter is not instance of Show');

    this.startedAt = new Date();
    this.show = show;
    this.bot = bot;

    this.userId = userId || shortid.generate();
    this.incrValue = 0;
    this.bucket = gcs.bucket(bucket);
    this.logger = logger || createLogger(userId);


    this.botTasksCount = 0;
    this.botFreeResolves = [];

    this.lastScreenshot = null;
  }

  incr() {
    const v = this.incrValue;
    this.incrValue += 1;
    return `${Date.now()}-${v}`;
  }

  gcsKey(filename) {
    return [
      this.userId,
      `${this.show.constructor.name}-${this.show.ref}`,
      filename,
    ].join('/');
  }

  async gcsUpload(ContentType, filename, Body) {
    const options = {
      destination: filename,
      metadata: {
        contentType: ContentType,
      },
      public: false,
    };

    const dest = this.gcsKey(filename);
    const file = this.bucket.file(dest);
    await file.save(Body, options);
  }

  retainBotTask() {
    this.botTasksCount += 1;
  }

  releaseBotTask() {
    this.botTasksCount -= 1;
    if (this.botTasksCount < 1) {
      this.botFreeResolves.forEach(r => r());
      this.botFreeResolves = [];
    }
  }

  async botFreePromise() {
    return new Promise((r) => {
      if (this.botTasksCount < 1) return r();
      return this.botFreeResolves.push(r);
    });
  }

  async botDump(prefix) {
    try {
      this.retainBotTask();
      const screenshot = await this.bot.page.screenshot();
      this.lastScreenshot = screenshot;
      this.gcsUpload('text/html', `${prefix}-page.html`, await this.bot.page.content());
      this.gcsUpload('image/png', `${prefix}-page.png`, screenshot);
    } catch (error) {
      this.logger.error('botDump', { error });
    } finally {
      this.releaseBotTask();
    }
  }

  onShowStartPlay(o) {
    this.gcsUpload('text/plain', `${this.incr()}-show-start-play.txt`, util.inspect(o, { depth: null, maxArrayLength: null, breakLength: 0 }));
  }

  onShowEndPlay(o) {
    const prefix = `${this.incr()}-show`;
    this.gcsUpload('text/plain', `${prefix}-end-play.txt`, util.inspect(o, { depth: null, maxArrayLength: null, breakLength: 0 }));
    this.botDump(prefix);
  }

  onSceneStartPlay(o) {
    const prefix = `${this.incr()}-scene-${o.SceneName}`;
    this.gcsUpload('text/plain', `${prefix}-start-play.txt`, util.inspect(o, { depth: null, maxArrayLength: null, breakLength: 0 }));
    this.botDump(prefix);
  }

  onSceneEndPlay(o) {
    const prefix = `${this.incr()}-scene-${o.SceneName}`;
    this.gcsUpload('text/plain', `${prefix}-end-play.txt`, util.inspect(o, { depth: null, maxArrayLength: null, breakLength: 0 }));
    this.botDump(prefix);
  }
}

module.exports = TheaterLogFirebaseReporter;
