const assert = require('assert');
const shortid = require('shortid');
const admin = require('firebase-admin');
const _ = require('lodash');
const Show = require('./theater/show');
const logger = require('../routers/bots/logger');

const db = admin.firestore();

class BotResultReporter {
  constructor({
    show,
    userId,
    botName,
  }) {
    assert(show instanceof Show, 'emitter is not instance of Show');

    this.botName = botName;
    this.show = show;
    this.status = 'Linked';
    this.userId = userId || shortid.generate();
    this.logger = logger;

    this.botTasksCount = 0;
    this.botFreeResolves = [];
  }

  // ===========================================================================================
  // --- Public API
  // ==========================================================================================

  async onCreditAccountBotResult(result) {
    if (result.meta) {
      // merge to profile
      await db.collection('profiles').doc(this.userId).set(result.meta, { merge: true });
    }

    const obj = await this.resultCreditAccountReport(result);
    try {
      await db.collection('profiles').doc(this.userId).collection('accounts').add(obj);
    } catch (error) {
      this.logger.error('onCreditAccountBotResult-failed to report', { error });
    }
  }

  async onCreditDocumentBotResult(result) {
    const obj = await this.resultCreditDocumentBotReport(result);
    try {
      await db.collection('reports').add(obj);
    } catch (error) {
      this.logger.error('onCreditDocumentBotResult-failed to report', { error });
    }
  }


  // ===========================================================================================
  // --- Internal Functions (Results)
  // ==========================================================================================

  async resultCreditAccountReport(obj) {
    const result = {
      statusVersion: new Date(),
      profileId: this.userId,
      status: obj.status || 'Linked',
      session: obj.status === 'Linked' ? await this.session() : null,
      botName: this.botName,
    };
    return Object.assign(result, obj);
  }

  async resultCreditDocumentBotReport(obj) {
    const result = {
      statusVersion: new Date(),
      botName: this.botName,
      profileId: this.userId,
      status: obj.status || 'Linked',
      score: this.show.context('score') || 0,
    };
    return _.omit(Object.assign(result, obj), ['report']);
  }


  // ===========================================================================================
  // --- Internal Functions
  // ==========================================================================================

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

  async session() {
    let session;
    this.retainBotTask();
    for (let i = 0; i < 100; i += 1) {
      try {
      // eslint-disable-next-line no-await-in-loop
        const bot = await this.show.bot();
        if (bot) {
          // eslint-disable-next-line no-await-in-loop
          session = await bot.exportCredential();
        }
        break;
      } catch (error) {
        this.logger.error('failed extracting session', { error });
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 100));
    }
    this.releaseBotTask();

    const data = {
      bot: this.botName,
      session,
      username: this.show.context('username') || this.show.context('tempUsername') || '',
      password: this.show.context('password') || this.show.context('tempPassword') || '',
    };
    return data;
  }
}

module.exports = BotResultReporter;