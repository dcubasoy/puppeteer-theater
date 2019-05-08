const ey = require('@nicomee/bt_backend-core');
const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class ExperianExistingAccountScene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        ecsError: {
          selector: '.ecs-error',
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(
      super.match(),
      this.context('existingAccount'),
    );
  }


  async play() {
    await super.play();
    throw new ey.Error(500, 'ExistingAccount');
  }
}

module.exports = ExperianExistingAccountScene;
