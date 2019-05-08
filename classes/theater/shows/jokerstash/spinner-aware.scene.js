const Scene = require('../../scene');

class JokerSpinnerAwareScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: Object.assign({
        jokerWaitingSpinner: {
          selector: '#wait',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        out: {
          selector: '.out',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        genericLoadingSpinner: {
          selector: '.loading',
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
        robotSpinner: {
          selector: 'header',
          match: e => /Are you a bad robot/.test(e.innerText),
          visibility: 'forbidden',
          visibilityAreaCheck: true,
        },
      }, args.elementQueries || {}),
    }));
  }
}

module.exports = JokerSpinnerAwareScene;
