
const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const AmexJustClickAwareScene = require('./just-click-aware-scene');

class AmexAccountHomeScene extends AmexJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        navHeaderBlock: {
          selector: 'a[title="Payments"]',
        },
        availableCredit: {
          selector: 'div.value-link-inline-block > div.data-value > span',
          visibility: 'optional',
        },
        totalBalance: {
          selector: 'div.line-item > div.data-value > div > span:first-child',
          visibility: 'optional',
        },
        activityContainer: {
          selector: '.activity-container',
          visibility: 'optional',
        },
        rewards: {
          selector: '#root > div:nth-child(1) > div > div:nth-child(2) > div > div > div.body > div.container.pad-1-tb > div > div > div > div:nth-child(2) > div:nth-child(3) > div > section > div > div > div.summary-container > div > div.summary-title > div > div.data-value',
          visibility: 'optional',
        },
        addUser: {
          selector: '#root > div:nth-child(1) > div > div:nth-child(2) > div > div > div.body > div.container.pad-1-tb > div > div > div > div:nth-child(4) > div.slot.col-lg-4 > div > div > div > div > div > div > div.links-container > ul > li:nth-child(4) > a',
          visibility: 'optional',
        },
      },
      generic: false,
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }


  async curtainFallen() {
    return PromiseCondition.and(super.curtainFallen(), this.context('signedIn'));
  }

  async play() {
    await super.play();
    this.log('Linked');

    if (await this.elements.rewards.visible()) {
      const rewardsPoints = await this.elements.rewards.innerText();
      this.log('Found account rewards points: ', rewardsPoints);
    }

    const availableCredit = await this.elements.availableCredit.innerText();
    const totalBalance = await this.elements.totalBalance.innerText();
    const accountActivity = await this.elements.activityContainer.innerText();

    this.show.emit('retailerBotResult', {
 status: 'Linked', availableCredit, totalBalance, accountActivity
});
    this.setContext('signedIn', true);
  }
}

module.exports = AmexAccountHomeScene;
