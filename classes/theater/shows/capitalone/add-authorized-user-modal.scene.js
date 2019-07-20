const Scene = require('../../scene');
const PromiseCondition = require('../../promise-condition');const CapitalOneJustClickAwareScene = require('./just-click-aware-scene');

class CapitalOneAddAuthorizedUserModalScene extends CapitalOneJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        header: {
          selector: 'h1.ease-modal-title.no-icon-mobile',
          match: e => /Add Account User/.test(e.innerText),
        },
        firstName: {
          selector: '#cc_addAccountUsers_first_name_text',
          visibility: 'optional',
        },
        lastName: {
          selector: '#cc_addAccountUsers_last_name_text',
          visibility: 'optional',
        },
        phone: {
          selector: '#cc-addAccountUsers-phonenumber-text',
          visibility: 'optional',
        },
        dob: {
          selector: '#cc_addAccountUsers_dateofbirth_text_TLNPI',
          visibility: 'optional',
        },
        ssn: {
          selector: '#cc_addAccountUsers_ssn_text_TLNPI',
          visibility: 'optional',
        },
        continueBtn: {
          selector: '#btn-cc-addAccountUsers-submit-user-info',
          visibility: 'optional',
        },
        acceptTerms: {
          selector: '#cc-addAccountUsers-acceptTermsAndConditions-button',
          visibility: 'optional',
        },
        addUserBtn: {
          selector: '#btn-cc-addAccountUsers-itsCorrect',
          visibility: 'optional',
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    const spec = this.context('spec');

    const socialsecuritynumber = spec.ssn.replace(/-/g, '');
    const dateofbirth = spec.dob.replace(/\//g, '');

    await this.elements.firstName.fill(spec.firstName);
    await this.elements.lastName.fill(spec.lastName);
    await this.elements.phone.fill(spec.phone);

    await this.elements.dob.fill(dateofbirth);
    await this.elements.ssn.fill(socialsecuritynumber);

    await this.elements.continueBtn.click();
    await this.elements.acceptTerms.click();
    await this.elements.addUserBtn.click();
  }
}

module.exports = CapitalOneAddAuthorizedUserModalScene;
