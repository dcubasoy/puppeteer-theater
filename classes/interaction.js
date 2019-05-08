const uuid = require('uuid');
const assert = require('assert');
const redis = require('../utils/redis');

const SESSION_TIMEOUT = 12000;

module.exports = class Interaction {
  /**
   * @param {string} userId
   * @param {string} sessId (optional)
   * @param {number} sessionTimeout (optional)
   */
  constructor({
    userId, sessId = null, sessionTimeout = SESSION_TIMEOUT, messageRules = [],
  }) {
    assert(typeof userId === 'string' && !!userId, 'userId as string is required');
    assert(Number.isFinite(sessionTimeout), 'sessionTimeout is not finite');

    this.isUp = false;
    this.sessId = sessId;
    this.userId = userId;
    this.sessionTimeout = sessionTimeout;

    this.messageRules = messageRules;
  }

  async logMeta(o = {}) {
    return Object.assign({ sessId: this.sessId, userId: this.userId }, o);
  }

  redisKey(key = '') {
    assert(this.sessId, 'sessId is empty');
    return `bots:session-ids:${this.userId}:${this.sessId}${key}`;
  }

  async up() {
    if (this.isUp) return;
    this.isUp = true;

    if (this.sessId) {
      if (!(await this.extend())) {
        throw new Error('Request timed out.');
      }
      return;
    }

    for (let okay = null; !okay;) {
      this.sessId = uuid();
      // eslint-disable-next-line no-await-in-loop
      logger.silly('generating sessId', await this.logMeta());
      // eslint-disable-next-line no-await-in-loop
      okay = await redis.set(this.redisKey(), 1, 'ex', this.sessionTimeout, 'nx');
    }
    await redis.del(this.redisKey(':output:l'));
    await redis.del(this.redisKey(':bot:l'));
    await redis.del(this.redisKey(':user:l'));
  }

  async down() {
    if (!this.isUp) return;
    this.isUp = false;

    await redis.multi()
      .del(this.redisKey())
      .del(this.redisKey(':output:l'))
      .del(this.redisKey(':bot:l'))
      .del(this.redisKey(':user:l'));
  }

  async checkValid() {
    if (!this.isUp) return false;

    if (!(await redis.exists(this.redisKey()))) {
      throw new Error('Request timed out. Please rerun operation.');
    }
    return true;
  }

  async extend() {
    const result = redis.set(this.redisKey(), 1, 'ex', this.sessionTimeout, 'xx');
    if (!result) return result;

    return redis.pipeline()
      .expire(this.redisKey(':bot:l'), this.sessionTimeout)
      .expire(this.redisKey(':user:l'), this.sessionTimeout)
      .expire(this.redisKey(':output:l'), this.sessionTimeout)
      .set(this.redisKey(), 1, 'ex', this.sessionTimeout, 'xx')
      .exec();
  }

  /**
   * @param {string} to bot|user
   * @param {object} [query=null]
   * @return {Promise} redis lpush result
   */
  async speak(to, query = null) {
    assert(~['bot', 'user'].indexOf(to), 'to !== bot|user');

    // eslint-disable-next-line no-param-reassign, no-multi-assign
    if (!await this.extend()) {
      throw new Error('Request timed out. Please rerun operation.');
    }

    if (query.error) {
      (this.messageRules || []).every(([test, message]) => {
        if (test.test(query.error)) {
          Object.assign(query, {
            error: message,
          });
          return false;
        }
        return true;
      });
    }

    return redis.multi()
      .lpush(this.redisKey(`:${to}:l`), JSON.stringify(query))
      .expire(this.redisKey(`:${to}:l`), this.sessionTimeout)
      .exec();
  }

  /**
   * @param {string} to bot|user
   * @return {Promise} [description]
   */
  async listen(to) {
    const startedAt = Date.now();
    /* eslint-disable no-await-in-loop */
    for (; Date.now() < startedAt + (this.sessionTimeout * 1000);) {
      if (!(await this.checkValid())) break;
      const result = await redis.lpop(this.redisKey(`:${to}:l`));
      if (result) {
        try {
          const json = JSON.parse(result);
          return json;
        } catch (err) {
          process.stderr.write(`res:${result}\n${err.stack}\n`);
        }
      }
      await new Promise(r => setTimeout(r, 100));
    }
    /* eslint-enable */
    throw new Error(400, 'Request timed out. Please rerun operation.');
  }
};
