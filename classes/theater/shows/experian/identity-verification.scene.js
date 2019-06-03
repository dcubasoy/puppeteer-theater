/* eslint-disable no-continue */
const states = require('us-state-codes');
const moment = require('moment');
const horoscope = require('horoscope');

const Scene = require('../../scene');
const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../promise-condition');
const utils = require('../../../../routers/bots/utils');


class ExperianIdentityVerificationScene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        authenticationHeader: {
          selector: 'h2',
          match: e => /Authentication Questions/i.test(e.textContent),
        },
        submitBtn: {
          selector: '#tt-id-reg-btn-op3-1',
        },
        answers: {
          selector: 'label',
          visibility: 'optional',
        },
        questions: {
          selector: 'fieldset > legend',
          visibility: 'optional',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(7500),
        new Scene.Extensions.PreventCurtainFall({ playCount: 1 }),
        new Scene.Extensions.Delay(7500),
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
    const dob = spec.dob.split('/');
    const ssn = spec.ssn.split('-');

    const questions = await this.elements.questions.innerTexts();
    this.log('Answering ID Verification Questions: ', questions);

    const labels = await this.elements.answers.innerTexts();
    this.log('Found answers: ', labels);

    const { issuedState, issuedYear } = await utils.checkSSN(spec.ssn);
    this.setContext('issuedState', issuedState);
    this.setContext('issuedYear', issuedYear);

    const issuedStateName = states.getStateCodeByStateName(issuedState);
    const employer = spec.employerName.toUpperCase();
    const astro = horoscope.getSign({ month: parseInt(dob[0], 10), day: parseInt(dob[1], 10) }).toUpperCase();
    const zodiac = horoscope.getZodiac(parseInt(dob[2], 10)).toUpperCase();

    const age = moment().diff(moment(dob[2], 'YYYY'), 'years');
    const dobYear = dob[2];

    this.log(`Matching employer: ${employer}`);
    this.log(`Matching issued state (SSN), Full: ${issuedState}`);
    this.log(`Matching issued state (SSN), Abbreviated: ${issuedStateName}`);

    this.log(`Matching astrological sign: ${astro}`);
    this.log(`Matching zodiac sign: ${zodiac}`);
    this.log(`Matching current age: ${age}`);

    this.log('Matching potential answers');

    const matched = await this.elements.labels.eval((els, stateIssued, stateIssuedFull, employerName, astroSign, zodiacSign, age, dobYear, lastFourSSN) => Array
    .from(els)
    .map((e) => e.innerText.includes('NONE OF THE ABOVE/DOES NOT APPLY') ? e.click() : null)
    .forEach((e) => {
      let matches = [];
      const plusFiveOffset = parseInt(dobYear, 10) + 5;
      const plusOneOffset = parseInt(dobYear, 10) + 1;
      const minusOneOffset = parseInt(dobYear, 10) - 1;


      function checkAnswer(el, target) {
        if (el.innerText.includes(target)) {
            el.click();
            matches.push(el.innerText);
        }

        if (el.parentElement.parentElement.innerText.includes('last four digits of your cellular phone number')) {
          // ignore
        }
      }

      checkAnswer(stateIssued);
      checkAnswer(stateIssuedFull);
      checkAnswer(employerName);

      checkAnswer(astroSign);
      checkAnswer(zodiacSign);

      checkAnswer(plusFiveOffset);
      checkAnswer(age);
      checkAnswer(dobYear);
      checkAnswer(lastFourSSN);

      checkAnswer(plusOneOffset);
      checkAnswer(minusOneOffset);

      return matches;

    }), issuedStateName, issuedState, employer, astro, zodiac, age, dob[2], ssn[2]);

    this.log('Matched ID Verification answers: ', matched);
    await this.elements.submitBtn.click();
  }
}

module.exports = ExperianIdentityVerificationScene;
