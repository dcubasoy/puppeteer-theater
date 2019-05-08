/* eslint-disable no-await-in-loop */
const Scene = require('../../scene');
const _ = require('lodash');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class JokerStashDumpsScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        dumpsFilters: {
          selector: '.dumps',
        },
        base: {
          selector: '#base',
          visibility: 'optional',
        },
        bin: {
          selector: '#bin',
          visibility: 'optional',
        },
        availableTracks: {
          selector: '#tracks',
          visibility: 'optional',
        },
        expDate: {
          selector: '#exp_date',
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
        resetFiltersBtn: {
          selector: '[name="reset"]',
          visibility: 'optional',
        },
        resultsTable: {
          selector: '.dumps-table',
          visibility: 'optional',
        },
        nextBtn: {
          selector: '._btn._btng',
          match: e => /Next/.test(e.innerText),
          visibility: 'optional',
        },
      },
      generic: false,
    }, args));
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

  async match() {
    return PromiseCondition.and(super.match(), this.context('dumpsHarvesterEnabled'));
  }

  async curtainFallen() {
    return PromiseCondition.and(super.curtainFallen(), this.context('dumpsExtracted'));
  }

  async play() {
    await super.play();
    this.setContinousPlayLimit('nextBtn', 44);

    if (!this.context('filtered')) {
      await this.applyFilters();
    }

    while (PromiseCondition.and(this.elements.nextBtn.visible(), this.elements.resultsTable.value(), +(this.elements.nextBtn.value()) < 44)) {
      const dumpsData = await this.elements.resultsTable.tableContent();

      const currentPage = await this.elements.nextBtn.value();
      this.log('Current page index: ', +currentPage);
      if (Number.isNaN(+currentPage)) return;

      this.show.emit('botDataResult', {
        id: `${Date.now()}-${`${currentPage}`}_dumps`,
        data: dumpsData,
        type: 'dumps',
      });


      await this.elements.nextBtn.click();
    }

    this.setContext('dumpsExtracted', true);
  }
}

module.exports = JokerStashDumpsScene;
