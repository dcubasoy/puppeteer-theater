const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneAccountSummaryDetailScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        mainAccountDetail: {
          selector: '#mainAccountDetail',
        },
        viewMoreBtn: {
          selector: '#moreAccountServicesLink',
          visibility: 'optional',
        },
        closeModalBtn: {
          selector: '.ease-modal-close-button',
          visibility: 'optional',
        },
        setupAuthUserLink: {
          selector: '#setupAuthUserLink',
          visibility: 'optional',
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    await this.elements.viewMoreBtn.click();

    const bot = await this.show.bot();
    await bot.page.waitFor(10000);
    await this.elements.setupAuthUserLink.click();

    await bot.page.evaluate(() => {
      document.querySelector('#setupAuthUserLink').click();
    });
  }
}

module.exports = CapitalOneAccountSummaryDetailScene;
