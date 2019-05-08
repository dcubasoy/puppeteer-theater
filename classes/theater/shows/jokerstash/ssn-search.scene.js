const Scene = require('../../scene');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class JokerStashSSNSearchScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        errors: {
          selector: 'ul.\\_errors > li',
          visibility: 'optional',
          visibilityAreaCheck: true,
        },
        firstName: {
          selector: 'tr.new > td:nth-of-type(2) > input',
        },
        lastName: {
          selector: 'tr.new > td:nth-of-type(3) > input',
        },
        dateOfBirth: {
          selector: '[name="dob"]',
        },
        state: {
          selector: '[name="state"]',
        },
        city: {
          selector: '[name="city"]',
        },
        zip: {
          selector: '[name="zip"]',
        },
        runSearchBtn: {
          selector: 'u.\\_btn.\\_btng.do-search',
        },
        bulkSearch: {
          selector: '[name="bulk"]',
        },
        runBulkSearch: {
          selector: 'button.\\_btn.\\_btng',
        },
      },
      generic: false,
      extensions: [
        new Scene.Extensions.Delay(5000),
        new Scene.Extensions.PreventCurtainFall({playCount: 1}),
      ]
    }, args));
  }


  async match() {
    return PromiseCondition.and(
      super.match(),
      this.context('ssnHarvesterEnabled'),
    );
  }


  async play() {
    await super.play();

    if (await this.elements.errors.visible()) {
      const errorMessage = await this.elements.errors.innerText();

      this.log('errorMessage:', errorMessage);
      await this.interaction().speak('user', {
        error: errorMessage || undefined,
        tags: [
        ],
      });
    }

    // need to get input from user

    if ((!this.context('firstName') && !this.context('lastName')) || (!this.context('state') && !this.context('dob'))) {
      this.log('asking for search target queries');
      await this.interaction().speak('user', {
        error: errorMessage || undefined,
        tags: [
          {
            tag: 'input',
            type: 'text',
            id: 'firstName',
            description: 'First Name (Ex. NICO)',
            value: this.context('firstName'),
          },
          {
            tag: 'input',
            type: 'text',
            id: 'lastName',
            description: 'Last Name (Ex. KOKONAS)',
            value: this.context('lastName'),
          },
          {
            tag: 'input',
            type: 'text',
            id: 'state',
            description: 'State (Abbreviated)',
            value: this.context('state'),
          },
          {
            tag: 'input',
            type: 'text',
            id: 'dateofbirth',
            description: 'Date of Birth (YYYY--MM--DD)',
            value: this.context('dob'),
          }
        ],
      });

      const { firstName, lastName, dateofbirth,  } = (await this.interaction().listen('bot')).reply;
      this.log('Received user input: ', firstName, lastName, dateofbirth);

      this.setContext('firstName', firstName);
      this.setContext('lastName', lastName);
      this.setContext('dateofbirth', dateofbirth);
    }

    await this.elements.firstName.fill(this.context('firstName'));
    await this.elements.lastName.fill(this.context('lastName'));

    await this.elements.state.fill(this.context('dateofbirth'));
    await this.elements.runSearchBtn.click();
  }
}

module.exports = JokerStashSSNSearchScene;
