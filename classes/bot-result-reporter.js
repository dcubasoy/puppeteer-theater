const assert = require('assert');
const shortid = require('shortid');
const winston = require('winston');
const admin = require('firebase-admin');
const _ = require('lodash');
const Show = require('./theater/show');

const redis = require('../utils/redis');

const db = admin.firestore();


/**
 * @description Reporter linked to redis & firestore: updates credit scores, uploads the latest credit report, saves the session after successful registration.
 * @export onCreditDocumentBotResult: Intended for emitting object containing PDF report.
 * @export onCreditAccountBotResult: Intended for emitting object contanining username/password/session (credential) captured upon succesful registration on credit monitoring site.
 *
 * @param {Show} show: The show injected when constructor called.
 * @param {string} userId: Unique id for profiles in firestore. Adjust accordingly to your use-case.
 * @param {string} botName: Bot name (ex. creditkarma-extractor)
 */
class BotResultReporter {
  constructor({
    show,
    userId,
    logger,
    botName,
  }) {
    assert(show instanceof Show, 'emitter is not instance of Show');

    this.botName = botName;
    this.show = show;
    this.status = 'Linked';
    this.userId = userId || shortid.generate();
    this.logger = logger || winston.createLogger([new winston.transports.Console({ colorize: true })]);

    this.botTasksCount = 0;
    this.botFreeResolves = [];
  }

  // ===========================================================================================
  // --- Public API
  // ==========================================================================================


  async onCreditAccountBotResult(result) {
    const obj = await this.resultCreditAccountReport(result);
    try {
      await db.collection('profiles').doc(this.userId).set({ accounts: admin.firestore.FieldValue.arrayUnion(obj) });
    } catch (error) {
      this.console.error('onCreditAccountBotResult-failed to report', { error });
    }
  }

  async onCreditDocumentBotResult(result) {
    const obj = await this.resultCreditDocumentBotReport(result);
    try {
      await db.collection('reports').add(obj);
    } catch (error) {
      this.console.error('onCreditDocumentBotResult-failed to report', { error });
    }
  }

  async onRetailerBotResult(result) {
    const obj = await this.resultRetailerBotReport(result);
    try {
      await db.collection('botResults').add(obj);
      await redis.lpush('retailer-bot-consumer:', JSON.stringify(result));
    } catch (error) {
      this.logger.error('failed to report', { error });
    }
  }


  // ===========================================================================================
  // --- Internal Functions (Results)
  // ==========================================================================================

  /**
   * @description Reporter for extraction of CreditReports from providers.
   *
   * @param {any} obj
   * @returns
   *
   * @memberOf BotResultReporter
   */
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

  /**
   * @description Reporter for the succesful creation of account with a credit provider.
   *
   * @param {any} obj
   * @returns
   *
   * @memberOf BotResultReporter
   */
  async resultCreditDocumentBotReport(obj) {
    const result = {
      statusVersion: new Date(),
      botName: this.botName,
      profileId: this.userId,
      score: this.show.context('score') || 0,
    };
    return _.omit(Object.assign(result, obj), ['report']);
  }

  async resultRetailerBotReport(obj) {
    const result = {
      statusVersion: new Date(),
      userId: this.userId,
      status: obj.status || 'Linked',
      session: obj.status === 'Linked' ? await this.session() : null,
      botName: this.botName,
    };
    return Object.assign(result, obj);
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
    try {
      // eslint-disable-next-line no-await-in-loop
      const bot = await this.show.bot();
      if (bot) {
        // eslint-disable-next-line no-await-in-loop
        session = await bot.exportCredential();
      }
    } catch (error) {
      this.console.error('failed extracting session', { error });
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, 100));
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
