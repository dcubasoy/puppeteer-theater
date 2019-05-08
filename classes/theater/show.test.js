const Show = require('./show');
const Scene = require('./scene');
const PromiseCondition = require('../../utils/promise-condition');

class ForkGroupAScene1 extends Scene {
  constructor(args) {
    super(Object.assign({ generic: false }, args));
  }

  async match() {
    return PromiseCondition.and(super.match(), this.context('group') === 'A');
  }

  async curtainFallen() {
    return PromiseCondition.and(super.curtainFallen(), this.context('forkGroupAScene1'));
  }

  async play() {
    this.setContext('forkGroupAScene1', true);
  }
}

class ForkGroupAScene2 extends Scene {
  constructor(args) {
    super(Object.assign({ generic: false }, args));
  }

  async match() {
    return PromiseCondition.and(super.match(), this.context('group') === 'A', this.context('forkGroupAScene1'));
  }

  async curtainFallen() {
    return PromiseCondition.and(super.curtainFallen(), this.context('forkGroupAScene2'));
  }

  async play() {
    this.setContext('forkGroupAScene2', true);
  }
}

class ForkGroupBScene1 extends Scene {
  constructor(args) {
    super(Object.assign({ generic: false }, args));
  }

  async match() {
    return PromiseCondition.and(super.match(), this.context('group') === 'B');
  }

  async curtainFallen() {
    return PromiseCondition.and(super.curtainFallen(), this.context('forkGroupBScene1'));
  }

  async play() {
    this.setContext('forkGroupBScene1', true);
  }
}

class ForkGroupBScene2 extends Scene {
  constructor(args) {
    super(Object.assign({ generic: false }, args));
  }

  async match() {
    return PromiseCondition.and(super.match(), this.context('group') === 'B', this.context('forkGroupBScene1'));
  }

  async curtainFallen() {
    return PromiseCondition.and(super.curtainFallen(), this.context('forkGroupBScene2'));
  }

  async play() {
    this.setContext('forkGroupBScene2', true);
  }
}

class ForkMenuScene extends Scene {
  constructor(args) {
    super(Object.assign({
      extensions: [new Scene.Extensions.Fork([
        {
          fork: async () => this.setContext('group', 'A'),
          Scenes: [ForkGroupAScene1, ForkGroupAScene2],
        },
        {
          fork: async () => this.setContext('group', 'B'),
          Scenes: [ForkGroupBScene1, ForkGroupBScene2],
        },
      ])],
    }, args));
  }
}

class ForkTestShow extends Show {}
ForkTestShow.Scenes = [
  ForkMenuScene,
  ForkGroupAScene1,
  ForkGroupAScene2,
  ForkGroupBScene1,
  ForkGroupBScene2,
];

async function test() {
  const show = new ForkTestShow({ Scenes: ForkTestShow.Scenes });
  await show.play();
}

test();
