const AWS = require('aws-sdk');
const shortid = require('shortid');
const assert = require('assert');
const util = require('util');
const Show = require('./theater/show');

const createLogger = require('../utils/logger');

const s3 = new AWS.S3();

class TheaterLogS3Reporter {
  constructor({
    show,
    bot,
    userId,
    bucket = `${process.env.GCLOUD_BUCKET_PREFIX}-theater-logs`,
    // eslint-disable-next-line no-shadow
    logger,
  }) {
    assert(show instanceof Show, 'emitter is not instance of Show');

    this.startedAt = new Date();
    this.show = show;
    this.bot = bot;
    this.logger = logger || createLogger(userId);

    this.userId = userId || shortid.v4();
    this.incrValue = 0;
    this.bucket = bucket;

    this.botTasksCount = 0;
    this.botFreeResolves = [];
    this.lastScreenshot = null;
  }

  incr() {
    const v = this.incrValue;
    this.incrValue += 1;
    return `${Date.now()}-${v}`;
  }

  s3Key(filename) {
    return [
      process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
      this.userId,
      `${this.startedAt.toISOString()}|${this.show.constructor.name}|${this.show.ref}`,
      filename,
    ].join('/');
  }

  async upload(ContentType, filename, Body) {
    try {
      await s3.upload({
        Body,
        Bucket: this.bucket,
        ContentType,
        Key: this.s3Key(filename),
      }).promise();
    } catch (error) {
      this.logger.error
('s3Upload', { error });
    }
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
      this.upload('text/html', `${prefix}-page.html`, await this.bot.page.content());
      this.upload('image/png', `${prefix}-page.png`, screenshot);
    } catch (error) {
      this.logger.error
('botDump', { error });
    } finally {
      this.releaseBotTask();
    }
  }

  onShowStartPlay(o) {
    this.upload('text/plain', `${this.incr()}-show-start-play.txt`, util.inspect(o, { depth: null, maxArrayLength: null, breakLength: 0 }));
  }

  onShowEndPlay(o) {
    const prefix = `${this.incr()}-show`;
    this.upload('text/plain', `${prefix}-end-play.txt`, util.inspect(o, { depth: null, maxArrayLength: null, breakLength: 0 }));
    this.botDump(prefix);
  }

  onSceneStartPlay(o) {
    const prefix = `${this.incr()}-scene-${o.SceneName}`;
    this.upload('text/plain', `${prefix}-start-play.txt`, util.inspect(o, { depth: null, maxArrayLength: null, breakLength: 0 }));
    this.botDump(prefix);
  }

  onSceneEndPlay(o) {
    const prefix = `${this.incr()}-scene-${o.SceneName}`;
    this.upload('text/plain', `${prefix}-end-play.txt`, util.inspect(o, { depth: null, maxArrayLength: null, breakLength: 0 }));
    this.botDump(prefix);
  }
}

module.exports = TheaterLogS3Reporter;
