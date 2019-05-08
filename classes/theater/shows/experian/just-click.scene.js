const Scene = require('../../scene');

const Selectors = {
  closeModalBtn: 'button[data-ng-bind="config.closeButton.text"]',
  closeModal: 'button[data-ng-class="config.closeButton.cssClass"]',
  getReportNowBtn: 'div.ct-button > a.btn.btn-lg.btn-primary',
  renewSessionBtn: 'div.banner-sign-in > a.ecs-btn.ecs-btn--action.ecs-btn--slide',
  startForFreeCTABtn: 'div.buttons-text-group-wrap > a.btn.btn-secondary.btn-icon-cta',
  viewNowModalBtn: 'button.hidden-xs.ecs-btn.ecs-btn--block.ng-binding.ecs-btn--info',
  exploreNowBtn: 'a.ecs-btn.ecs-btn--info.waitlist__explore-now',
  submitAndContinueBtn: 'button[data-tms="registration-op2confirm-submit"]',
  getCreditReportCTABtn: 'div.center-col.text-xs-center > a.btn.btn-secondary.btn-icon-cta',
  keepCurrentMembershipBtn: 'button[data-tms="interstitial-login-decline"]',
  bypassPhoneAuthBtn: 'a[data-ui-sref="ecs.login.ato.question"]',
  offerInterceptBtn: 'button[data-tms="registration-offerintercept-submit"]',

};

class ExperianJustClickScene extends Scene {
  constructor(args) {
    super(Object.assign(args, {
      elementQueries: Object.keys(Selectors)
        .map(k => [k, { selector: Selectors[k], visibility: 'required:groupA' }])
        .concat(Object.keys(args.elementQueries || {})
          .map(k => [k, args.elementQueries[k]]))
        .reduce((p, c) => Object.assign(p, { [c[0]]: c[1] }), {}),
      extensions: [new Scene.Extensions.Click({ once: true })],
    }));
  }
}
ExperianJustClickScene.Selectors = Selectors;

module.exports = ExperianJustClickScene;
