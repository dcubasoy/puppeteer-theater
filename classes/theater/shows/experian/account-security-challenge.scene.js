const Scene = require('../../scene');
const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class ExperianAccountATOPromptPage extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        atoPage: {
          selector: '.ato-page,.ato-page .call-text,.ato-page h2,.comp-cred-page,.comp-cred-page h2',
        },
        answer: {
          selector: '[name="answer"]',
          visibility: 'optional',
        },
        securityPIN: {
          selector: '[name="pin"]',
          visibility: 'optional',
        },
        rememberDevice: {
          selector: '.ecs-checkbox',
          visibility: 'optional',
        },
        dobMonth: {
          selector: 'select[name="dob-month"]',
          visibility: 'optional',
        },
        dobDay: {
          selector: 'select[name="dob-day"]',
          visibility: 'optional',
        },
        dobYear: {
          selector: 'select[name="dob-year"]',
          visibility: 'optional',
        },
        ssn: {
          selector: 'input[name="ssn"]',
          visibility: 'optional',
        },
        nextBtn: {
          selector: 'button.ecs-btn.ecs-btn--info',
          visibility: 'optional',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
      ],
    }, args));
  }

  async match() {
    return PromiseCondition.and(
      super.match(),
    );
  }

  async play() {
    await super.play();
    const spec = this.context('spec');
    const bot = await this.show.bot();

    await this.elements.answer.fill('MARIE');
    await this.elements.nextBtn.click();
    await bot.page.waitFor(5000);

    await this.elements.securityPIN.fill('4344');
    await this.elements.rememberDevice.click();
    await this.elements.nextBtn.click();
    await bot.page.waitFor(5000);
  }
}

module.exports = ExperianAccountATOPromptPage;
