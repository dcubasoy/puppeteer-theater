const Scene = require('../../scene');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class JokerStashRulesAndRefundPolicyScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        addFundsHeader: {
          selector: 'h1',
          match: e => /Rules & Refund Policy/.test(e.innerText),
        },
        currentPartnerRating: {
          selector: '.\\_rb',
        },
        readMoreHereBtn: {
          selector: 'div.\\_twocol.hpad > div:nth-of-type(1) > p:nth-of-type(2) > a.\\_btn',
          match: e => /Read more here/.test(e.innerText),
        },
      },
    }, args));
  }


  async match() {
    return PromiseCondition.and(
      super.match(),
    );
  }



  async play() {
    await super.play();
    const currentPartnerRating = await this.elements.currentPartnerRating.innerText();
    this.log('Found currentPartnerRating: ', balance);
  }
}

module.exports = JokerStashRulesAndRefundPolicyScene;
