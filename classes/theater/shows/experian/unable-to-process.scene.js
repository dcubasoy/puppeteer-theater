const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../promise-condition');

class ExperianUnableToProcessScene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        containerError: {
          selector: '.container-error',
        },
      },
    }, args));
  }

  async play() {
    await super.play();

    // re-release bot
    const bot = await this.show.bot();
    this.log('deinit');
    await bot.deinit();

    this.log('init');
    await bot.init();

    if (this.context('harvestEnabled')) {
      this.log('retry extraction');
      await bot.page.goto('https://usa.experian.com/login/#/index?br=exp', { referer: 'https://www.usa.experian.com', waitUntil: 'networkidle0' });
    }
    if (this.context('signupEnabled')) {
      this.log('retry signup');
      await bot.page.goto('https://www.freecreditreport.com/c/#/registration?offer=at_fcras100&br=fcr', { referer: 'https://www.usa.experian.com', waitUntil: 'networkidle0' });
    }
  }
}

module.exports = ExperianUnableToProcessScene;
