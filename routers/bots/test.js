const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const url = require('url');

const logger = require('../bots/logger.js');
const packageJson = require('../../package');

// Wrapper Class Imports
const PuppeteerBot1a = require('../../classes/puppeteer-bot-1a');


// ===========================================================================================
// --- Router
// ===========================================================================================
const router = module.exports = express.Router();
router.use(bodyParser.json({ limit: '800mb' }));

async function debugCapture(page) {
  if (process.env.NODE_ENV === 'production' || !page) return;
  return page.screenshot({ path: `/tmp/${page.url()}-${Date.now()}.png`, fullPage: true, quality: 100 });
}


router.post('/experian', async (req, res) => {
  const screenshots = [];

  try {
    const result = await runExperianBot(req.body);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.status(500).send(e.message);
  }
});



async function runExperianBot(body) {

}
