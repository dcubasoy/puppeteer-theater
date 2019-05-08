const Scene = require('../../scene');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');

class JokerTemporarilyUnavailableMaitenanceScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        stashMaitenanceHeader: {
          selector: 'header',
          match: e => /Temporary Offline/.test(e.innerText),
        },
        stashMaitenance: {
          selector: 'div.in',
          match: e => /The Stash is closed for maintenance/.test(e.innerText),
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
      ],
    }, args));
  }

  async play() {
    await super.play();
    this.log('Stash is Temporarily Unavailable...');
    this.show.emit('SIGINTbotResult', {
      status: 'TemporarilyUnavailable',
    });
  }
}

module.exports = JokerTemporarilyUnavailableMaitenanceScene;
