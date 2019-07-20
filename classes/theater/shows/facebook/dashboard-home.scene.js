const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');
class FacebookDashboardHomeScene extends Scene {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        bluebar: {
          selector: '.homeSideNav,input[placeholder="Search"]',
        },
        accountSettingsBtn: {
          selector: '#userNavigationLabel',
          match: e => /Settings/ig.test(e.innerText),
        },
        userNavigationLabel: {
          selector: '#userNavigationLabel',
          visibility: 'optional',
        },
        paymentHistorySubNav: {
          selector: 'a[href="https://www.facebook.com/settings?tab=payments&section=history"],li.navSubmenu.\\__MenuItem.selected > a > span > span',
          visibility: 'optional',
        },
      },
      extensions: [
        new Scene.Extensions.PreventCurtainFall({playCount: 1 }),
        new Scene.Extensions.Delay(),
      ],
      generic: false,
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    this.log('Linked');
    this.show.emit('retailerBotResult', {
      status: 'Linked',
    });
    // TODO: [BAC-10] Add Scenes for Profile Extraction
    this.setContext('signedIn', true);


    await this.elements.userNavigationLabel.click();
    await this.elements.paymentHistorySubNav.click();
  }
}

module.exports = FacebookDashboardHomeScene;
