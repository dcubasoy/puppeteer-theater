const assert = require('assert');
const createTest = require('./create-test');
const JokerShow = require('../shows/jokerstash');

createTest({
  Show: JokerShow,
  Scenes: JokerShow.SceneSets.Default,
}, (test) => {
  test({ name: 'should match JokerStashCalmDownScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/joker/calm-down.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      JokerShow.Scenes.JokerStashCalmDownScene);
  });

  test({ name: 'should match JokerStashAddFundsScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/joker/add-funds.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      JokerShow.Scenes.JokerStashAddFundsScene);
  });

  test({ name: 'should match JokerStashCheckoutCartScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/joker/checkout-cart.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      JokerShow.Scenes.JokerStashCheckoutCartScene);
  });

  test({ name: 'should match JokerStashAddJokerJustClickSceneFundsScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/joker/just-click.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      JokerShow.Scenes.JokerJustClickScene);
  });

  test({ name: 'should match JokerLoginScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/joker/login-main.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      JokerShow.Scenes.JokerLoginScene);
  });


  test({ name: 'should match JokerStashRegistrationScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/joker/registration.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      JokerShow.Scenes.JokerStashRegistrationScene);
  });


  test({ name: 'should match JokerStashSSNSearchScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/joker/ssn-search.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      JokerShow.Scenes.JokerStashSSNSearchScene);
  });

  test({ name: 'should match JokerStashCardsScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/joker/stash-cards.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      JokerShow.Scenes.JokerStashCardsScene);
  });

  test({ name: 'should match JokerStashDumpsScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/joker/stash-dumps.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      JokerShow.Scenes.JokerStashDumpsScene);
  });

  test({ name: 'should match JokerStashNewsScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/joker/stash-news.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      JokerShow.Scenes.JokerStashNewsScene);
  });

  test({ name: 'should match JokerStashOrdersScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/joker/stash-orders.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      JokerShow.Scenes.JokerStashOrdersScene);
  });


  test({ name: 'should match JokerTemporarilyUnavailableMaitenanceScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/joker/stash-closed.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      JokerShow.Scenes.JokerTemporarilyUnavailableMaitenanceScene);
  });


  test({ name: 'should match JokerStashTransactionSummaryScene' }, async ({ show, bot, baseUrl }) => {
    await bot.page.goto(`${baseUrl}/joker/stash-closed.html`);
    const scene = await show.scene();
    assert.equal(scene.constructor,
      JokerShow.Scenes.JokerStashTransactionSummaryScene);
  });


});


