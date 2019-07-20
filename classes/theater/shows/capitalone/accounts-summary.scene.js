const _ = require('lodash');
const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneAccountsSummaryScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        helloContainer: {
          selector: '.helloContainer,#greetingMessage',
        },
        balances: {
          selector: '.bal',
        },
        profileDropdownNav: {
          selector: '#profileLink',
          visibility: 'optional',
        },
        accountsContainer: {
          selector: '.accounts.ul',
          visibility: 'optional',
        },
        accountPrefsSubNav: {
          selector: '#accountprefs',
          visibility: 'optional',
        },
        viewMore: {
          selector: '#viewMore',
          visibility: 'optional',
        },
        msgsContainer: {
          selector: '.msgsContainer',
          visibility: 'optional',
        },
        accountNumberTrail: {
          selector: '.accnumbertrail',
          visibility: 'optional',
        },
      },
      generic: false,
    }, args));
  }

  async curtainFallen() {
    return PromiseCondition.and(super.curtainFallen(), this.context('accountNumbers'));
  }

  async play() {
    await super.play();
    this.log('Linked');
    this.show.emit('retailerBotResult', {
      status: 'Linked',
    });

    const balances = await this.elements.balances.innerText();
    const credit = await this.elements.msgsContainer.innerText();

    const regexp = /[^0-9]([0-9]{4})[^0-9]/g;
    const accountsText = (await this.elements.accountNumberTrail.innerTexts())
      .map(t => `${t} `)
      .join('\n');
    let accountNumbers = [];
    let accountNumber;
    do {
      accountNumber = regexp.exec(accountsText);
      if (accountNumber && accountNumber[1]) {
        accountNumbers.push(accountNumber[1]);
      }
    } while (accountNumber);
    accountNumbers = _.uniq(accountNumbers);

    this.log('extracted accountNumbers:', accountNumbers);
    this.show.emit('retailerBotResult', {
      status: 'Linked',
      accountNumbers,
      credit,
      balances,
      lastExtractionStatus: `accounts ${accountNumbers} found`,
      lastExtractionDateEnded: Date.now(),
    });
    this.setContext('accountNumbers', accountNumbers);
  }
}

module.exports = CapitalOneAccountsSummaryScene;
