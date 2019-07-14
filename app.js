const tmp = require('tmp');

tmp.setGracefulCleanup();

const morgan = require('morgan');
const express = require('express');

const packageJson = require('./package.json');

const app = express();

app.use(morgan('combined'));

app.get('/', async (req, res) => {
  res.status(200).send(`${packageJson.name}@${packageJson.version}`);
});

// Basic REST API to demonstrate bot execution via Theater framework for puppeteer.
app.use('/bots', require('./routers/bots'));

app.use((err, req, res) => res.status(500).send({ message: (err && err.message) ? err.message : 'Unknown' }));

module.exports = app;
