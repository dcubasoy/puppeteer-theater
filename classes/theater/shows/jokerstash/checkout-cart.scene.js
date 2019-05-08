const Scene = require('../../scene');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class JokerStashCheckoutCartScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        cardsHeader: {
          selector: 'h1',
          match: e => /Your Cart/.test(e.innerText),
        },
        cardsTable: {
          selector: '.dt-cards > table',
          visibility: 'optional',
        },
        dumpsTable: {
          selector: '.dt-dumps > table',
          visibility: 'optional',
        },
        cartSummary: {
          selector: '.buy-summary',
          visibility: 'optional',
        },
        buyAllWithDiscountBtn: {
          selector: 'u.to-buy-all.\\_btn.\\_btng',
          visibility: 'optional',
        },
        cartTable: {
          selector: '.cart-table',
          visibility: 'optional',
        },
        clearCartBtn: {
          selector: 'a.\\_btn.\\_confirm_click',
          visibility: 'optional',
        },
      },
      generic: false,
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match(), this.context('cartExtractionEnabled'));
  }

  async play() {
    await super.play();

    const summary = await this.elements.cartSummary.innerText();
    this.log('Found cart summary: ', summary);

    if (await this.elements.cardsTable.visible()) {
      const cards = await this.elements.cartTable.tableContent();
      this.show.emit('cardBotDataResult', {
        id: `${this.context('sourceId')}_cart_cards`,
        data: cards,
        type: 'cards',
      });
    }

    if (await this.elements.dumpsTable.visible()) {
      const dumps = await this.elements.cartTable.tableContent();
      this.show.emit('cardBotDataResult', {
        id: `${this.context('sourceId')}_cart_dumps`,
        data: dumps,
        type: 'dumps',
      });
    }

    await this.elements.clearCartBtn.click();
    this.show.emit('cardBotDataResult', {
      status: 'Linked',
      lastExtractionStatus: 'OK',
    });
    this.setContext('cartExtracted', true);
  }
}

module.exports = JokerStashCheckoutCartScene;
