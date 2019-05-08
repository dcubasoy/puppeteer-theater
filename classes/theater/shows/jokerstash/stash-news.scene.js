const moment = require('moment-timezone');
const Scene = require('../../scene');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class JokerStashNewsScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        newsHeader: {
          selector: 'h1',
          match: e => /Stash News/.test(e.innerText),
        },
        stashUpdates: {
          selector: '#motto',
          visibility: 'optional',
        },
        latestNews: {
          selector: '.new',
          visibility: 'optional',
        },
        newsArticles: {
          selector: '.\\_articles',
          visibility: 'optional',
        },
        userBalance: {
          selector: 'span.user-balance',
          visibility: 'optional',
        },
        userRating: {
          selector: 'a > span.\\_rating.\\_rb',
          visibility: 'optional',
        },
        cardsNav: {
          selector: '#ncc > a',
          visibility: 'optional',
        },
        dumpsNav: {
          selector: '#ndumps > a',
          visibility: 'optional',
        },
        ordersNav: {
          selector: '#norders > a',
          visibility: 'optional',
        },
        logoutNav: {
          selector: 'a.logout',
          visibility: 'optional',
        },
      },
      extensions: [
        new Scene.Extensions.PreventCurtainFall({playCount: 1}),
      ],
      generic: false,
    }, args));
  }

  async play() {
    await super.play();
    const bot = await this.show.bot();

    this.setContinousPlayLimit('latestNews', 1);

    const balance = await this.elements.userBalance.innerText();
    this.log('Found balance: ', balance);
    this.setContext('balance', +balance);

    const updates = await this.elements.stashUpdates.innerText();

    if (/\+?\d+/.test(updates)) {
      const newCount = +updates.match(/\+?\d+/)[0].replace('+', '').trim();
      let baseContent = await this.elements.latestNews.innerText();
      baseContent = baseContent.split('ALL STUFF WILL BE AVAILABLE AT')[0].split('TIME FOR REFUNDS')[0];
      baseContent = baseContent.split('ALL STUFF WILL BE AVAILABLE AT')[1].split('JSTASH LINK')[0].replace('New York City Time,', '').trim().replace('(evening update)', '').replace('(morning update)', '').trim();

      const baseReleaseDate = moment(releaseDateParsed, 'America/New_York').toDate();
      this.log(`Extracted base content: ${baseContent} | Base Releae Date: ${baseReleaseDate.toLocaleString('en-us')}`);
      this.show.emit('botMonitoringResult', { baseReleaseDate, baseContent });
    }

    if (this.context('cardHarvesterEnabled')) {
      await this.elements.cardsNav.click();
    }

    if (this.context('dumpsHarvesterEnabled')) {
      await this.elements.dumpsNav.click();
    }
    this.setContext('newsExtracted', true);
  }
}

module.exports = JokerStashNewsScene;
