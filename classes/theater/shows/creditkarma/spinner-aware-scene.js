const Scene = require('../../scene');

class CreditKarmaSpinnerAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: Object.assign({
        loadingInner: {
          selector: '.loading-inner',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        loading: {
          selector: '.loading',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        loadingDots: {
          selector: '.ck-loading-dots',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        adviceCardLoadingDots: {
          selector: '.advice-loading-dots',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        adviceActionLoading: {
          selector: '.advice-card.action-loading',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        interstitialUpdate: {
          selector: '.interstitial-update',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        interstitialUpdateLoading: {
          selector: '.update-interstitial-wrapper,.update-interstitial-header',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        interstitialUpdateIcons: {
          selector: '.interstitial-icons-wrap,.interstitial-icon-02',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        lookingRecommendation: {
          selector: '.looking-recommendation',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        pleaseWaitLoadingSpinner: {
          selector: 'ma0.mt4',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },

        pleaseWaitLoadingSnap: {
          selector: 'h2',
          match: e => /Please wait/.test(e.innerText),
          visibility: 'forbidden',
        },
      }, args.elementQueries || {}),
    }));
  }
}

module.exports = CreditKarmaSpinnerAwareScene;
