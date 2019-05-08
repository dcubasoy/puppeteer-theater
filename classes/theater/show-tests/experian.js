const assert = require('assert');
const createTest = require('./create-test');
const ExperianShow = require('../shows/experian');

createTest({
  Show: ExperianShow,
  Scenes: ExperianShow.SceneSets.Default,
}, (test) => {
  test({ name: 'should match ExperianLoginMainScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/login-main.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianLoginMainScene);
  });


  test({ name: 'should match ExperianFinancialProfileScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/financial-profile.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianFinancialProfileScene);
  });


  test({ name: 'should match ExperianCreateAccountStep1Scene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/step-1.html`);
    const scene = await show.scene();
    show.setContext('signupEnabled', true);
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianCreateAccountStep1Scene);
  });


  test({ name: 'should match ExperianCreateAccountStep2Scene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/step-2.html`);
    const scene = await show.scene();
    show.setContext('signupEnabled', true);
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianCreateAccountStep2Scene);
  });

  test({ name: 'should match ExperianCreateAccountStep3Scene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/signup-step-3.html`);
    const scene = await show.scene();
    show.setContext('signupEnabled', true);
    show.setContext('op4', true);
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianCreateAccountStep3Scene);
  });


  test({ name: 'should match ExperianDashboardScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/dashboard-main.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianDashboardScene);
  });

  test({ name: 'should match ExperianCreditAlertsScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/credit-alerts.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianCreditAlertsScene);
  });

  test({ name: 'should match ExperianUpdatePaymentMethodScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/update-payment.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianUpdatePaymentMethodScene);
  });

  test({ name: 'should match ExperianNoHitCreditFileScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/ecredable.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianNoHitCreditFileScene);
  });

  test({ name: 'should match ExperianTemporarilyUnavailableScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/server-error.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianTemporarilyUnavailableScene);
  });

  test({ name: 'should match ExperianUpgradeAccountMembershipScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/add-fico.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianUpgradeAccountMembershipScene);
  });


  test({ name: 'should match ExperianUpgradeAccountMembershipScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/upgrade.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianUpgradeAccountMembershipScene);
  });

  test({ name: 'should match ExperianUnableToProcessScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/unable-to-process.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianUnableToProcessScene);
  });


  test({ name: 'should match ExperianJustClickScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/signed-out.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianJustClickScene);
  });

  test({ name: 'should match ExperianSecurityChallengeScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/mfa.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianSecurityChallengeScene);
  });

  test({ name: 'should match ExperianConfirmFullSSNScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/experian/confirm-full-ssn.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      ExperianShow.Scenes.ExperianConfirmFullSSNScene);
  });
});
