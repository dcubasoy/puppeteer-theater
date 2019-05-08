/* eslint-disable no-await-in-loop */
const Scene = require('../../scene');
const _ = require('lodash');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');


class JokerStashCardsScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        cardsFilters: {
          selector: '.cards',
        },
        dumpsNav: {
          selector: '#ndumps > a',
          visibility: 'optional',
        },
        base: {
          selector: '#base',
          visibility: 'optional',
        },
        USA: {
          selector: 'fieldset.\\_fset > div:nth-of-type(1) > p:nth-of-type(1) > label > a:nth-of-type(1)',
          match: e => /United States/.test(e.innerText),
          visibility: 'optional',
        },
        baseFilter: {
          selector: '.filp',
          visibility: 'optional',
        },
        bin: {
          selector: '#bin',
          visibility: 'optional',
        },
        applyFiltersBtn: {
          selector: 'p.\\_fbtn > button.\\_btn.\\_btng',
          visibility: 'optional',
        },
        addAllToCartBtn: {
          selector: '.dumps-all-to-cart',
          visibility: 'optional',
        },
        resultsTable: {
          selector: '.dumps-table',
          visibility: 'optional',
        },
        goToCartBtn: {
          selector: '#cart > p:nth-of-type(3) > a.\\_btn',
          visibility: 'optional',
        },
        nextBtn: {
          selector: '.\\_btn.\\_btng',
          match: e => /Next/.test(e.innerText),
          visibility: 'optional',
        },
      },
      generic: false,
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match(), this.context('cardHarvesterEnabled'));
  }

  async curtainFallen() {
    return PromiseCondition.and(super.curtainFallen(), this.context('cardsExtracted'));
  }

  async applyFilters() {

    if (this.context('bins')) {
      const BINs = this.context('bins');

      this.log('Found target BINs: ', BINs.join(','));
      await this.elements.bin.fill(BINs.join('\n'));
    }

    if (this.context('baseContent')) {

      this.log('Found target base: ', BINs.join(','));
      await this.elements.base.$select(this.context('baseContent'));
    }

    await this.elements.USA.click();
    await this.elements.applyFiltersBtn.click();

    this.setContext('filtered', true);
}

  async play() {
    await super.play();
    this.setContinousPlayLimit('nextBtn', 44);

    if (!this.context('filtered')) {
      await this.applyFilters();
    }

    while (PromiseCondition.and(this.elements.nextBtn.visible(), this.elements.resultsTable.value(), +(this.elements.nextBtn.value()) < 44)) {
      const cardsData = await this.elements.resultsTable.tableContent();

      const currentPage = await this.elements.nextBtn.value();
      this.log('Current page index: ', +currentPage);
      if (Number.isNaN(+currentPage)) return;

      this.show.emit('botDataResult', {
        id: `${Date.now()}-${`${currentPage}`}_cards`,
        data: cardsData,
        type: 'cards',
      });

      if (this.context('cartExtractionEnabled')) {
        await this.elements.addAllToCartBtn.click();
      }
      await this.elements.nextBtn.click();
    }

    this.setContext('cardsExtracted', true);
  }
}

module.exports = JokerStashCardsScene;
