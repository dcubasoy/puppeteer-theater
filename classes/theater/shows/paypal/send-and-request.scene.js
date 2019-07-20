const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');

const PayPalJustClickAwareScene = require('./just-click-aware-scene');
const Chance = require('chance');

const chance = new Chance();
class PayPalSendAndRequestScene extends PayPalJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        sendHeader: {
          selector: 'h2',
          match: e => /Send money to anyone/.test(e.innerText),
        },
        sendRecipient: {
          selector: '#fn-sendRecipient',
        },
        nextBtn: {
          selector: 'button.vx\\_btn',
          visibility: 'optional',
        },
        personalPaymentBtn: {
          selector: '#personal',
          visibility: 'optional',
        },
        goodsOrServicePaymentBtn: {
          selector: '[name="goodsPayment"]',
          visibility: 'optional',
        },
        paymentAmount: {
          selector: '#fn-amount',
          visibility: 'optional',
        },
        sendMoneyBtn: {
          selector: 'button.vx_btn.preview-getFundingOptions.preview-sendMoney',
          visibility: 'optional',
        },
        noteField: {
          selector: 'label[for="noteField"]',
          visibility: 'optional',
        },
        continueBtn: {
          selector: 'button[data-nemo="continue"]',
        },
      },
      extensions: [
        new Scene.Extensions.PreventCurtainFall({playCount: 1}),
        new Scene.Extensions.Click('sendMoneyBtn'),
        new Scene.Extensions.Delay(10000),
        new Scene.Extensions.Click('continueBtn'),
        new Scene.Extensions.Delay(10000),
      ],
      generic: false,
    }, args));
  }

  async play() {
    const bot = await this.show.bot();
    const spec = this.context('spec');



    await this.elements.sendRecipient.fill(spec.email);
    await this.elements.nextBtn.click();
    await bot.page.waitFor(5000);

    await super.play();

    await this.elements.personalPaymentBtn.click();
    await this.elements.paymentAmount.fill(spec.amount || '50.00');

    const paymentNote = chance.pickone(this.context('messages'));
    await this.elements.noteField.click();


    await this.elements.noteField.fill(paymentNote);

    await this.elements.sendMoneyBtn.click();
  }
}

module.exports = PayPalSendAndRequestScene;
