const Scene = require('../../scene');
const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../promise-condition');

class ExperianDashboardScene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        summary: {
          selector: '.overview\\__top-summary-pod',
        },
        refreshNowBtn: {
          selector: 'a.ecs-btn.ecs-btn--action.refresh-btn',
          visibility: 'optional',
        },
        navCreditReports: {
          selector: '#tt-id-shared-auth-rb-1 > div > div > ul > li:nth-child(2) > a',
          visibility: 'optional',
        },
        accountSummary: {
          selector: '#tt-id-accounts-summary',
          visibility: 'optional',
        },
        scoreUnavailable: {
          selector: '.score-rating-unavailable',
          visibility: 'optional',
        },
        addFICOScoreBtn: {
          selector: '#tt-id-reportssummary-carousel-noRecentExperianScore-primaryCta-card0-upgrade > a',
          visibility: 'optional',
        },
        upsellRefreshBtn: {
          selector: '.upsell-refresh-btn',
          visibility: 'optional',
        },
        scoreDial: {
          selector: '.score-arc-score-text.score-text-large',
          visibility: 'optional',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
        new Scene.Extensions.PreventCurtainFall({ playCount: 1 }),
      ],
      generic: false,
    }, args));

    this.show.on('creditAccountBotResult', (o) => {
      if (o.status !== 'Linked') return;
      // now we can confirm that username and password pair is good
      this.setContext('username', this.context('tempUsername') || this.context('username'));
      this.setContext('password', this.context('tempPassword') || this.context('password'));
    });
  }


  async play() {
    await super.play();
    this.log('Linked');
    this.show.emit('creditAccountBotResult', {
      status: 'Linked',
    });

    this.setContext('signedIn', true);
  }
}

module.exports = ExperianDashboardScene;
