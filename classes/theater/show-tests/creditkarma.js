const assert = require('assert');
const createTest = require('./create-test');
const CreditKarmaShow = require('../shows/creditkarma');

createTest({
  Show: CreditKarmaShow,
  Scenes: CreditKarmaShow.SceneSets.Default,
}, (test) => {
  test({ name: 'should match CreditKarmaCreateAccountStep1Scene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/creditkarma/signup-step-1.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      CreditKarmaShow.Scenes.CreditKarmaCreateAccountStep1Scene);
  });

  test({ name: 'should match CreditKarmaCreateAccountStep2Scene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/creditkarma/signup-step-2.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      CreditKarmaShow.Scenes.CreditKarmaCreateAccountStep2Scene);
  });

  test({ name: 'should match CreditKarmaIdentityVerificationScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/creditkarma/identity-verification.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      CreditKarmaShow.Scenes.CreditKarmaIdentityVerificationScene);
  });



  test({ name: 'should match CreditKarmaDashboardScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/creditkarma/dashboard.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      CreditKarmaShow.Scenes.CreditKarmaDashboardScene);
  });

  test({ name: 'should match CreditKarmaLoginScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/creditkarma/auth-logon.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      CreditKarmaShow.Scenes.CreditKarmaLoginScene);
  });


  test({ name: 'should match CreditKarmaWelcomeBackScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/creditkarma/welcome-back.html`);
    const scene = await show.scene();
    show.setContext('inactive', true);
    assert.equal(scene.constructor,
      CreditKarmaShow.Scenes.CreditKarmaWelcomeBackScene);
  });


  test({ name: 'should match CreditKarmaRenewSessionScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/creditkarma/existing-account.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      CreditKarmaShow.Scenes.CreditKarmaRenewSessionScene);
  });



  test({ name: 'should match CreditKarmaPrintMyReportScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/creditkarma/print-report.html`);
    show.setContext('harvestEnabled', true);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      CreditKarmaShow.Scenes.CreditKarmaPrintMyReportScene);
  });


  test({ name: 'should match CreditKarmaValidationFailedScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/creditkarma/validate-identity.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      CreditKarmaShow.Scenes.CreditKarmaValidationFailedScene);
  });

  test({ name: 'should match CreditKarmaRenewCookieScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/creditkarma/temp-unavailable.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      CreditKarmaShow.Scenes.CreditKarmaRenewCookieScene);
  });

  test({ name: 'should match CreditKarmaCreditHealthScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/creditkarma/credit-health.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      CreditKarmaShow.Scenes.CreditKarmaCreditHealthScene);
  });


  test({ name: 'should match CreditKarmaCreditChangesScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/creditkarma/credit-changes.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      CreditKarmaShow.Scenes.CreditKarmaCreditChangesScene);
  });

});

