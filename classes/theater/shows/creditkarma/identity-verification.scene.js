/* eslint-disable no-continue */
/* eslint-disable max-len */
const moment = require('moment');
const horoscope = require('horoscope');
const states = require('us-state-codes');
const utils = require('../../../../routers/bots/utils');
const CreditKarmaJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class CreditKarmaIdentityVerificationScene extends CreditKarmaJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        submitBtn: {
          selector: '#register-section input.registration-button',
        },
        questions: {
          selector: '.validationQuestions',
        },
        answers: {
          selector: 'label',
          visibility: 'optional',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(5000),
      ],
    }, args));
  }


  async play() {
    await super.play();

    const spec = this.context('spec');
    const dob = spec.dob.split('/');
    const ssn = spec.ssn.split('-');

    const questions = await this.elements.questions.innerTexts();
    const labels = await this.elements.answers.innerTexts();
    this.log('Found questions: ', questions);
    this.log('Found labels: ', labels);

    const { issuedState, issuedYear, age } = await utils.checkSSN(spec.ssn);
    this.setContext('issuedState', issuedState);
    this.setContext('issuedYear', issuedYear);
    this.setContext('age', age);

    const issuedStateName = states.getStateCodeByStateName(issuedState);
    const employer = spec.employerName.toUpperCase();
    const astro = horoscope.getSign({ month: parseInt(dob[0], 10), day: parseInt(dob[1], 10) }).toUpperCase();
    const zodiac = horoscope.getZodiac(parseInt(dob[2], 10)).toUpperCase();

    this.log(`Matching employer: ${employer}`);
    this.log(`Matching issued state (SSN), Full: ${issuedState}`);
    this.log(`Matching issued state (SSN), Abbreviated: ${issuedStateName}`);

    this.log(`Matching astrological sign: ${astro}`);
    this.log(`Matching zodiac sign: ${zodiac}`);

    const matched = await this.elements.labels.eval((els, stateIssued, stateIssuedFull, employerName, astroSign, zodiacSign, dobYear, lastFourSSN) => Array
    .from(els)
    .map((e) => e.innerText.includes('NONE OF THE ABOVE') ? e.click() : null)
    .forEach((e) => {
      let matches = [];

      function checkAnswer(el, target) {
        if (el.innerText.includes(target)) {
            el.click();
            matches.push(el.innerText);
        }
      }

      checkAnswer(stateIssued);
      checkAnswer(stateIssuedFull);
      checkAnswer(employerName);

      checkAnswer(astroSign);
      checkAnswer(zodiacSign);
      checkAnswer(dobYear);
      checkAnswer(lastFourSSN);

      return matches;

    }), issuedStateName, issuedState, employer, astro, zodiac, dob[2], ssn[2]);

    this.log('Matched ID Verification answers: ', matched);
    await this.elements.submitBtn.click();
  }
}

module.exports = CreditKarmaIdentityVerificationScene;
