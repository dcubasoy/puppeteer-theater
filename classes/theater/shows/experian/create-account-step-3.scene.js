
const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class ExperianCreateAccountStep3Scene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        sidebarHeader: {
          selector: '.medium',
          match: e => /Protect Your Account/.test(e.innerText),
        },
        securityQuestion: {
          selector: "select[name='securityQuestions.question']",
        },
        securityQuestionAnswer: {
          selector: "input[name='securityQuestions.answer']",
        },
        securityPIN: {
          selector: 'input[data-tms="component-ecspin-pin"]',
          visibility: 'optional',
        },
        confirmPIN: {
          selector: 'input[data-tms="component-ecspin-confirm"]',
          visibility: 'optional',
        },
        goldenQuestion: {
          selector: "select[name='goldenQuestion']",
        },
        viewCreditNowBtn: {
          selector: '#tt-id-reg-btn-op4-1',
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    this.setContinousPlayLimit('sidebarHeader', 1);
    const bot = await this.show.bot();

    await this.elements.securityQuestion.fill('What was the name of your first boyfriend or girlfriend?');
    await this.elements.securityQuestionAnswer.fill('MARIE');

    await bot.page.keyboard.press('Tab');
    await bot.page.keyboard.type('4344', { delay: 250 });

    await bot.page.keyboard.press('Tab');
    await bot.page.keyboard.type('4344', { delay: 250 });

    await this.elements.securityPIN.fill('4344');
    await this.elements.confirmPIN.fill('4344');

    await this.elements.goldenQuestion.fill('Often');
    await this.elements.viewCreditNowBtn.click();
  }
}

module.exports = ExperianCreateAccountStep3Scene;
